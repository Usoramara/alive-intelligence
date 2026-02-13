import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';

interface PerceptionResult {
  type: 'text' | 'visual';
  content: string;
  timestamp: number;
  salience: number;
}

interface AttentionFocus {
  content: string;
  modality: 'text' | 'visual' | 'multimodal';
  salience: number;
  urgency: number;
  timestamp: number;
}

export class AttentionEngine extends Engine {
  private focusHistory: AttentionFocus[] = [];
  private currentFocus: AttentionFocus | null = null;

  constructor() {
    super(ENGINE_IDS.ATTENTION);
  }

  protected subscribesTo(): SignalType[] {
    return ['perception-result', 'intuition-alert', 'safety-alert'];
  }

  protected process(signals: Signal[]): void {
    const perceptions: PerceptionResult[] = [];

    for (const signal of signals) {
      if (signal.type === 'perception-result') {
        perceptions.push(signal.payload as PerceptionResult);
      } else if (signal.type === 'safety-alert') {
        // Safety always gets highest attention
        this.currentFocus = {
          content: (signal.payload as { message: string }).message,
          modality: 'text',
          salience: 1.0,
          urgency: 1.0,
          timestamp: Date.now(),
        };
        this.emit('attention-focus', this.currentFocus, {
          target: ENGINE_IDS.BINDER,
          priority: SIGNAL_PRIORITIES.CRITICAL,
        });
        return;
      } else if (signal.type === 'intuition-alert') {
        // Intuition bumps attention
        this.selfState.nudge('arousal', 0.05);
        this.selfState.nudge('curiosity', 0.1);
      }
    }

    if (perceptions.length === 0) return;

    // Select highest salience perception
    const selfState = this.selfState.get();
    const scored = perceptions.map(p => ({
      ...p,
      score: p.salience * (1 + selfState.curiosity * 0.3) * (1 + selfState.arousal * 0.2),
    }));
    scored.sort((a, b) => b.score - a.score);

    const winner = scored[0];
    this.currentFocus = {
      content: winner.content,
      modality: winner.type,
      salience: winner.salience,
      urgency: winner.score,
      timestamp: winner.timestamp,
    };

    // Keep focus history (last 10)
    this.focusHistory.push(this.currentFocus);
    if (this.focusHistory.length > 10) this.focusHistory.shift();

    // Forward to binder for cross-modal integration
    this.emit('attention-focus', this.currentFocus, {
      target: ENGINE_IDS.BINDER,
      priority: SIGNAL_PRIORITIES.HIGH,
    });

    // Also notify memory for potential retrieval
    this.emit('attention-focus', this.currentFocus, {
      target: ENGINE_IDS.MEMORY,
      priority: SIGNAL_PRIORITIES.MEDIUM,
    });

    this.debugInfo = `Focus: "${winner.content.slice(0, 25)}..." (${winner.salience.toFixed(2)})`;
    this.status = 'idle';
  }

  protected onIdle(): void {
    this.status = 'idle';
    // Attention naturally decays
    if (this.currentFocus && Date.now() - this.currentFocus.timestamp > 5000) {
      this.currentFocus = null;
    }
  }
}
