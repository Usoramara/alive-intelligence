import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';

export class IntuitionEngine extends Engine {
  private recentContents: string[] = [];
  private anomalyPatterns: Array<{ pattern: RegExp; alert: string }> = [
    { pattern: /\b(but|however|although|yet)\b.*\b(good|great|fine|ok)\b/i, alert: 'Contradiction detected — saying positive but hedging' },
    { pattern: /\b(always|never|everyone|nobody)\b/i, alert: 'Absolute language — might indicate strong emotion or cognitive distortion' },
    { pattern: /\b(help|please|need|desperate)\b/i, alert: 'Request for help detected — elevated significance' },
    { pattern: /\?\s*\?|\!\s*\!/i, alert: 'Repeated punctuation — heightened emotional expression' },
    { pattern: /\.{3,}/i, alert: 'Trailing off — possible hesitation or unspoken thoughts' },
  ];

  constructor() {
    super(ENGINE_IDS.INTUITION);
  }

  protected subscribesTo(): SignalType[] {
    return ['perception-result', 'bound-representation'];
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      const content = this.extractContent(signal);
      if (!content) continue;

      this.recentContents.push(content);
      if (this.recentContents.length > 20) this.recentContents.shift();

      // Check for anomalies
      for (const { pattern, alert } of this.anomalyPatterns) {
        if (pattern.test(content)) {
          this.emit('intuition-alert', {
            alert,
            content: content.slice(0, 50),
            confidence: 0.6,
          }, {
            target: [ENGINE_IDS.ATTENTION, ENGINE_IDS.ARBITER],
            priority: SIGNAL_PRIORITIES.MEDIUM,
          });

          this.selfState.nudge('curiosity', 0.05);
          this.selfState.nudge('arousal', 0.02);

          this.debugInfo = `Intuition: ${alert.slice(0, 40)}`;
          break;
        }
      }

      // Check for sudden topic shifts
      if (this.recentContents.length > 2) {
        const prev = this.recentContents[this.recentContents.length - 2];
        if (this.topicShift(prev, content)) {
          this.selfState.nudge('curiosity', 0.03);
          this.debugInfo = 'Topic shift detected';
        }
      }
    }
    this.status = 'idle';
  }

  private extractContent(signal: Signal): string | null {
    const payload = signal.payload as Record<string, unknown>;
    if (typeof payload.content === 'string') return payload.content;
    if (typeof payload.text === 'string') return payload.text;
    return null;
  }

  private topicShift(prev: string, current: string): boolean {
    // Very simple overlap check
    const prevWords = new Set(prev.toLowerCase().split(/\s+/));
    const currentWords = current.toLowerCase().split(/\s+/);
    const overlap = currentWords.filter(w => prevWords.has(w) && w.length > 3).length;
    return overlap < 1 && currentWords.length > 3;
  }
}
