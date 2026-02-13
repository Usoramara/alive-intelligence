import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';

interface ImaginationResult {
  scenario: string;
  source: string;
  timestamp: number;
}

export class HopeWorryEngine extends Engine {
  private hopes: string[] = [];
  private worries: string[] = [];

  constructor() {
    super(ENGINE_IDS.HOPE_WORRY);
  }

  protected subscribesTo(): SignalType[] {
    return ['imagination-result', 'strategy-update', 'person-state-update'];
  }

  getState(): { hopes: string[]; worries: string[] } {
    return { hopes: [...this.hopes], worries: [...this.worries] };
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      if (signal.type === 'imagination-result') {
        const result = signal.payload as ImaginationResult;
        this.evaluateScenario(result.scenario);
      }
    }
    this.status = 'idle';
  }

  private evaluateScenario(scenario: string): void {
    const lower = scenario.toLowerCase();

    // Simple sentiment for hope/worry classification
    const positiveWords = ['good', 'better', 'improve', 'grow', 'succeed', 'connect', 'understand', 'learn', 'discover'];
    const negativeWords = ['bad', 'worse', 'fail', 'lose', 'disconnect', 'misunderstand', 'hurt', 'wrong', 'struggle'];

    const posCount = positiveWords.filter(w => lower.includes(w)).length;
    const negCount = negativeWords.filter(w => lower.includes(w)).length;

    if (posCount > negCount) {
      this.hopes.push(scenario);
      if (this.hopes.length > 5) this.hopes.shift();
      this.selfState.nudge('valence', 0.02);
      this.selfState.nudge('energy', 0.01);
      this.debugInfo = `Hope: "${scenario.slice(0, 30)}..."`;
    } else if (negCount > posCount) {
      this.worries.push(scenario);
      if (this.worries.length > 5) this.worries.shift();
      this.selfState.nudge('valence', -0.02);
      this.selfState.nudge('arousal', 0.02);
      this.debugInfo = `Worry: "${scenario.slice(0, 30)}..."`;
    }

    this.emit('hope-worry-update', {
      hopes: this.hopes.slice(-3),
      worries: this.worries.slice(-3),
      balance: posCount - negCount,
    }, {
      target: [ENGINE_IDS.ARBITER, ENGINE_IDS.DEFAULT_MODE],
      priority: SIGNAL_PRIORITIES.LOW,
    });
  }
}
