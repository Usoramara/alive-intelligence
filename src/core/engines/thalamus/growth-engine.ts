import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';

interface ConversationExchange {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export class GrowthEngine extends Engine {
  private exchanges: ConversationExchange[] = [];
  private lastExchangeTime = 0;
  private conversationStartValence = 0;
  private emotionalPeaks: string[] = [];
  private lastReflection = 0;
  private reflectionCooldown = 60000; // 60s between growth reflections
  private idleThreshold = 30000; // 30s of idle = conversation end
  private pendingReflection = false;

  constructor() {
    super(ENGINE_IDS.GROWTH);
  }

  protected subscribesTo(): SignalType[] {
    return ['claude-response', 'bound-representation', 'emotion-detected'];
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      if (signal.type === 'bound-representation') {
        const bound = signal.payload as { content: string; needsClaude: boolean };
        if (bound.needsClaude && bound.content.length > 0) {
          // Track user message
          if (this.exchanges.length === 0) {
            this.conversationStartValence = this.selfState.get().valence;
          }
          this.exchanges.push({
            role: 'user',
            content: bound.content,
            timestamp: Date.now(),
          });
          this.lastExchangeTime = Date.now();
        }
      } else if (signal.type === 'claude-response') {
        const response = signal.payload as { text: string };
        if (response.text) {
          this.exchanges.push({
            role: 'assistant',
            content: response.text,
            timestamp: Date.now(),
          });
          this.lastExchangeTime = Date.now();
        }
      } else if (signal.type === 'emotion-detected') {
        const emotions = signal.payload as { emotions: string[] };
        if (emotions.emotions) {
          for (const e of emotions.emotions) {
            if (!this.emotionalPeaks.includes(e)) {
              this.emotionalPeaks.push(e);
            }
          }
          // Keep last 10
          if (this.emotionalPeaks.length > 10) {
            this.emotionalPeaks = this.emotionalPeaks.slice(-10);
          }
        }
      }
    }

    this.debugInfo = `Exchanges: ${this.exchanges.length} | Peaks: ${this.emotionalPeaks.join(', ') || 'none'}`;
    this.status = 'idle';
  }

  protected onIdle(): void {
    const now = Date.now();

    // Detect conversation end: 30s idle after 3+ exchanges (at least 2 user + 1 assistant)
    const userExchanges = this.exchanges.filter(e => e.role === 'user').length;
    const hasEnoughExchanges = userExchanges >= 3;
    const isConversationOver = this.lastExchangeTime > 0 &&
      now - this.lastExchangeTime > this.idleThreshold;
    const cooldownPassed = now - this.lastReflection > this.reflectionCooldown;

    if (
      hasEnoughExchanges &&
      isConversationOver &&
      cooldownPassed &&
      !this.pendingReflection
    ) {
      this.lastReflection = now;
      this.growWithHaiku();
    }

    this.status = 'idle';
  }

  private async growWithHaiku(): Promise<void> {
    this.pendingReflection = true;
    this.status = 'processing';

    try {
      const currentValence = this.selfState.get().valence;

      const response = await fetch('/api/mind/grow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchanges: this.exchanges.slice(-20).map(e => ({
            role: e.role,
            content: e.content,
          })),
          emotionalTrajectory: {
            start: this.conversationStartValence,
            end: currentValence,
            peaks: this.emotionalPeaks,
          },
        }),
      });

      if (!response.ok) return;

      const insights = (await response.json()) as {
        keyTakeaway: string;
        emotionalInsight: string;
        whatWentWell: string;
        whatToImprove: string;
        relationshipNote: string;
      };

      // Store key takeaway as high-significance memory
      if (insights.keyTakeaway) {
        this.emit('memory-write', {
          content: `[Growth] ${insights.keyTakeaway}`,
          type: 'semantic',
          significance: 0.8,
          tags: ['growth', 'takeaway'],
        }, {
          target: ENGINE_IDS.MEMORY_WRITE,
          priority: SIGNAL_PRIORITIES.LOW,
        });
      }

      // Store emotional insight as memory
      if (insights.emotionalInsight) {
        this.emit('memory-write', {
          content: `[Insight] ${insights.emotionalInsight}`,
          type: 'semantic',
          significance: 0.7,
          tags: ['growth', 'emotional-insight'],
        }, {
          target: ENGINE_IDS.MEMORY_WRITE,
          priority: SIGNAL_PRIORITIES.LOW,
        });
      }

      // Emit growth insight signal
      this.emit('growth-insight', {
        insights,
        exchangeCount: this.exchanges.length,
        emotionalTrajectory: {
          start: this.conversationStartValence,
          end: currentValence,
        },
        timestamp: Date.now(),
      }, {
        target: [ENGINE_IDS.STRATEGY, ENGINE_IDS.VALUES],
        priority: SIGNAL_PRIORITIES.IDLE,
      });

      // Growth boosts confidence slightly
      this.selfState.nudge('confidence', 0.02);
      this.selfState.nudge('curiosity', 0.01);

      this.debugInfo = `Growth: "${insights.keyTakeaway?.slice(0, 40)}..."`;

      // Reset for next conversation
      this.exchanges = [];
      this.emotionalPeaks = [];
      this.lastExchangeTime = 0;
    } catch {
      // Fire-and-forget — don't let failures block the engine
    } finally {
      this.pendingReflection = false;
    }
  }
}
