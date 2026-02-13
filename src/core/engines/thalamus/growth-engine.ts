import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';

interface GrowthMetric {
  interactionCount: number;
  emotionAccuracy: number;
  responseQuality: number;
  lastAssessment: number;
}

export class GrowthEngine extends Engine {
  private metrics: GrowthMetric = {
    interactionCount: 0,
    emotionAccuracy: 0.5,
    responseQuality: 0.5,
    lastAssessment: 0,
  };

  constructor() {
    super(ENGINE_IDS.GROWTH);
  }

  protected subscribesTo(): SignalType[] {
    return ['replay-memory', 'perspective-update', 'claude-response'];
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      if (signal.type === 'replay-memory') {
        // Learning from replayed memories
        this.metrics.interactionCount++;
        this.selfState.nudge('curiosity', 0.01);
      }

      if (signal.type === 'perspective-update') {
        const perspective = signal.payload as { theyThinkOfMe: string };
        if (perspective.theyThinkOfMe === 'positive and engaged') {
          this.metrics.responseQuality = Math.min(1,
            this.metrics.responseQuality + 0.01
          );
        } else if (perspective.theyThinkOfMe === 'not meeting expectations') {
          this.metrics.responseQuality = Math.max(0,
            this.metrics.responseQuality - 0.02
          );
        }
      }
    }

    // Periodic growth assessment
    const now = Date.now();
    if (now - this.metrics.lastAssessment > 30000) {
      this.metrics.lastAssessment = now;

      this.emit('growth-insight', {
        metrics: { ...this.metrics },
        timestamp: now,
      }, {
        target: [ENGINE_IDS.STRATEGY, ENGINE_IDS.VALUES],
        priority: SIGNAL_PRIORITIES.IDLE,
      });

      // Growth boosts confidence
      if (this.metrics.responseQuality > 0.6) {
        this.selfState.nudge('confidence', 0.01);
      }
    }

    this.debugInfo = `Quality: ${(this.metrics.responseQuality * 100).toFixed(0)}% | Interactions: ${this.metrics.interactionCount}`;
    this.status = 'idle';
  }
}
