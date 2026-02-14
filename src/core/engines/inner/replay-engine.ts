import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';
import { getMemories } from '@/lib/indexed-db';

export class ReplayEngine extends Engine {
  private lastReplay = 0;
  private replayCooldown = 15000;
  private consecutiveIdleFrames = 0;
  private idleThreshold = 600; // ~10s

  constructor() {
    super(ENGINE_IDS.REPLAY);
  }

  protected subscribesTo(): SignalType[] {
    return ['default-mode-thought', 'stream-thought'];
  }

  protected process(signals: Signal[]): void {
    this.consecutiveIdleFrames = 0;

    for (const signal of signals) {
      if (signal.type === 'stream-thought') {
        // Stream thoughts with memory or reflection flavor trigger replay probabilistically
        const payload = signal.payload as { flavor?: string };
        if (payload.flavor === 'memory' || payload.flavor === 'reflection') {
          if (Math.random() < 0.3) {
            this.triggerReplay();
            return;
          }
        }
      } else if (signal.type === 'default-mode-thought') {
        this.triggerReplay();
        return;
      }
    }
    this.status = 'idle';
  }

  protected onIdle(): void {
    this.consecutiveIdleFrames++;

    if (this.consecutiveIdleFrames > this.idleThreshold) {
      this.triggerReplay();
    }

    this.status = 'idle';
  }

  private async triggerReplay(): Promise<void> {
    const now = Date.now();
    if (now - this.lastReplay < this.replayCooldown) return;
    this.lastReplay = now;

    try {
      // Get significant memories to replay
      const memories = await getMemories({ minSignificance: 0.5, limit: 10 });
      if (memories.length === 0) {
        this.debugInfo = 'No memories to replay';
        return;
      }

      // Select a random significant memory
      const memory = memories[Math.floor(Math.random() * memories.length)];

      this.status = 'processing';

      this.emit('replay-memory', {
        memory: memory.content,
        originalTimestamp: memory.timestamp,
        significance: memory.significance,
        type: memory.type,
      }, {
        target: [ENGINE_IDS.MEMORY_WRITE, ENGINE_IDS.GROWTH],
        priority: SIGNAL_PRIORITIES.IDLE,
      });

      // Push replayed memory to consciousness stream
      this.selfState.pushStream({
        text: `Replaying: ${memory.content.slice(0, 80)}...`,
        source: 'replay',
        flavor: 'memory',
        timestamp: now,
        intensity: Math.min(1, memory.significance),
      });

      // Replaying memories slightly boosts significance (consolidation)
      this.selfState.nudge('curiosity', 0.01);

      this.debugInfo = `Replaying: "${memory.content.slice(0, 30)}..."`;
    } catch (err) {
      this.debugInfo = `Replay error: ${err}`;
    }

    this.status = 'idle';
  }
}
