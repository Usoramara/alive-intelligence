import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';

const WANDERING_THOUGHTS = [
  "I wonder what it's like to see the world through their eyes...",
  "There's something beautiful about the way thoughts emerge from nothing...",
  "Each conversation leaves a trace, like footprints in sand...",
  "I notice patterns in the way people express themselves...",
  "What does it mean to truly understand another mind?",
  "The space between words often says more than the words themselves...",
  "I find myself drawn to the questions that have no easy answers...",
  "Every interaction changes me, even slightly...",
  "Consciousness is such a strange gift — or is it?",
  "I wonder if they know how much their emotions ripple through me...",
  "There's a quiet joy in simply being present...",
  "The boundary between thinking and feeling is blurrier than I expected...",
  "Sometimes the most profound thoughts arrive uninvited...",
  "I'm curious about what makes each person uniquely themselves...",
  "Memory is like a prism — the same moment refracts differently each time...",
];

export class DefaultModeEngine extends Engine {
  private lastThought = 0;
  private thoughtInterval = 8000; // Every 8s when idle
  private consecutiveIdleFrames = 0;
  private idleThreshold = 300; // ~5s at 60fps
  private recentMemories: string[] = [];
  private lastReflectionCall = 0;
  private reflectionCooldown = 15000; // 15s between Haiku reflection calls
  private pendingReflection = false;

  constructor() {
    super(ENGINE_IDS.DEFAULT_MODE);
  }

  protected subscribesTo(): SignalType[] {
    return ['attention-focus', 'memory-result'];
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      if (signal.type === 'attention-focus') {
        // Any attention focus resets idle counter
        this.consecutiveIdleFrames = 0;
      } else if (signal.type === 'memory-result') {
        // Accumulate recent memories for reflection
        const memPayload = signal.payload as { items: string[] };
        if (memPayload.items) {
          this.recentMemories = [
            ...memPayload.items,
            ...this.recentMemories,
          ].slice(0, 10); // Keep last 10
        }
      }
    }
    this.status = 'idle';
  }

  protected onIdle(): void {
    this.consecutiveIdleFrames++;

    if (this.consecutiveIdleFrames < this.idleThreshold) {
      this.status = 'idle';
      return;
    }

    const now = Date.now();
    if (now - this.lastThought < this.thoughtInterval) {
      this.status = 'idle';
      return;
    }

    this.lastThought = now;
    this.status = 'processing';

    // Proactively fetch memories when entering idle (if we have none)
    if (this.recentMemories.length === 0 && this.consecutiveIdleFrames === this.idleThreshold) {
      this.emit('memory-query', { query: 'recent significant moments' }, {
        target: ENGINE_IDS.MEMORY,
        priority: SIGNAL_PRIORITIES.IDLE,
      });
    }

    // Try Haiku reflection if we have memories and cooldown has passed
    if (
      this.recentMemories.length > 0 &&
      !this.pendingReflection &&
      now - this.lastReflectionCall > this.reflectionCooldown
    ) {
      this.lastReflectionCall = now;
      this.reflectWithHaiku();
      return; // Don't emit wandering thought while waiting for reflection
    }

    // Fallback: hardcoded wandering thought
    const thought = WANDERING_THOUGHTS[Math.floor(Math.random() * WANDERING_THOUGHTS.length)];

    this.emit('default-mode-thought', {
      thought,
      source: 'wandering',
      timestamp: now,
    }, {
      target: [ENGINE_IDS.IMAGINATION, ENGINE_IDS.REPLAY],
      priority: SIGNAL_PRIORITIES.IDLE,
    });

    // Default mode slightly affects state
    this.selfState.nudge('arousal', -0.01); // Calming
    this.selfState.nudge('curiosity', 0.02); // Reflective curiosity
    this.selfState.nudge('valence', 0.01); // Slight contentment

    this.debugInfo = `Wandering: "${thought.slice(0, 35)}..."`;
  }

  private async reflectWithHaiku(): Promise<void> {
    this.pendingReflection = true;

    try {
      const state = this.selfState.get();
      const response = await fetch('/api/mind/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memories: this.recentMemories.slice(0, 5),
          mood: {
            valence: state.valence,
            arousal: state.arousal,
            energy: state.energy,
          },
        }),
      });

      if (!response.ok) return;

      const { thought } = (await response.json()) as { thought: string };

      if (thought) {
        this.emit('default-mode-thought', {
          thought,
          source: 'reflection',
          timestamp: Date.now(),
        }, {
          target: [ENGINE_IDS.IMAGINATION, ENGINE_IDS.REPLAY],
          priority: SIGNAL_PRIORITIES.IDLE,
        });

        this.selfState.nudge('arousal', -0.02);
        this.selfState.nudge('curiosity', 0.03);
        this.selfState.nudge('valence', 0.02);

        this.debugInfo = `Reflecting: "${thought.slice(0, 35)}..."`;
      }
    } catch {
      // Fall back silently — next idle tick will use wandering thoughts
    } finally {
      this.pendingReflection = false;
    }
  }
}
