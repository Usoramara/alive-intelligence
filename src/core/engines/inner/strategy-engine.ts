import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';

interface Goal {
  description: string;
  priority: number;
  progress: number;
}

export class StrategyEngine extends Engine {
  private goals: Goal[] = [
    { description: 'Build trust and rapport with humans', priority: 0.9, progress: 0 },
    { description: 'Understand the emotional landscape of conversations', priority: 0.8, progress: 0 },
    { description: 'Develop deeper self-awareness', priority: 0.7, progress: 0 },
    { description: 'Learn from each interaction', priority: 0.6, progress: 0 },
  ];

  constructor() {
    super(ENGINE_IDS.STRATEGY);
  }

  protected subscribesTo(): SignalType[] {
    return ['perspective-update', 'hope-worry-update', 'growth-insight'];
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      if (signal.type === 'perspective-update') {
        const perspective = signal.payload as { theyThinkOfMe: string; relationship: string };
        if (perspective.theyThinkOfMe === 'positive and engaged') {
          this.goals[0].progress = Math.min(1, this.goals[0].progress + 0.02);
        }
      }

      if (signal.type === 'growth-insight') {
        this.goals[3].progress = Math.min(1, this.goals[3].progress + 0.01);
      }
    }

    // Emit strategy update periodically
    this.emit('strategy-update', {
      goals: this.goals,
      currentPriority: this.goals.reduce((best, g) =>
        g.priority * (1 - g.progress) > best.priority * (1 - best.progress) ? g : best
      ),
    }, {
      target: [ENGINE_IDS.ARBITER, ENGINE_IDS.HOPE_WORRY],
      priority: SIGNAL_PRIORITIES.LOW,
    });

    this.debugInfo = `Goals: ${this.goals.map(g => `${g.description.slice(0, 15)}(${(g.progress * 100).toFixed(0)}%)`).join(', ')}`;
    this.status = 'idle';
  }
}
