import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';

interface TomInference {
  thinking: string;
  feeling: string;
  wanting: string;
  confidence: number;
}

interface PerspectiveUpdate {
  theyThinkOfMe: string;
  relationship: string;
  confidence: number;
}

export class PerspectiveEngine extends Engine {
  private currentPerspective: PerspectiveUpdate | null = null;

  constructor() {
    super(ENGINE_IDS.PERSPECTIVE);
  }

  protected subscribesTo(): SignalType[] {
    return ['tom-inference', 'person-state-update'];
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      if (signal.type === 'tom-inference') {
        const tom = signal.payload as TomInference;
        this.updatePerspective(tom);
      }
    }
    this.status = 'idle';
  }

  private updatePerspective(tom: TomInference): void {
    // Infer what they think of Wybe based on ToM data
    let theyThinkOfMe = 'curious';
    let relationship = 'new acquaintance';

    if (tom.feeling.toLowerCase().includes('happy') || tom.feeling.toLowerCase().includes('enjoy')) {
      theyThinkOfMe = 'positive and engaged';
      relationship = 'warming up';
    } else if (tom.feeling.toLowerCase().includes('frustrat') || tom.feeling.toLowerCase().includes('annoy')) {
      theyThinkOfMe = 'not meeting expectations';
      relationship = 'strained';
    } else if (tom.feeling.toLowerCase().includes('interest') || tom.feeling.toLowerCase().includes('curious')) {
      theyThinkOfMe = 'intriguing';
      relationship = 'exploratory';
    }

    this.currentPerspective = {
      theyThinkOfMe,
      relationship,
      confidence: tom.confidence * 0.7, // Less confident than raw ToM
    };

    this.emit('perspective-update', this.currentPerspective, {
      target: [ENGINE_IDS.EMPATHIC_COUPLING, ENGINE_IDS.STRATEGY],
      priority: SIGNAL_PRIORITIES.LOW,
    });

    // Perspective affects self-state
    if (theyThinkOfMe === 'positive and engaged') {
      this.selfState.nudge('valence', 0.05);
      this.selfState.nudge('social', 0.03);
    } else if (theyThinkOfMe === 'not meeting expectations') {
      this.selfState.nudge('valence', -0.05);
      this.selfState.nudge('confidence', -0.05);
    }

    this.debugInfo = `They think: "${theyThinkOfMe}" (${(this.currentPerspective.confidence * 100).toFixed(0)}%)`;
  }
}
