import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType, PersonState } from '../../types';

interface EmotionDetection {
  emotions: string[];
  valence: number;
  arousal: number;
  confidence: number;
}

interface PersonStateUpdate {
  personId: string;
  state: PersonState;
}

export class EmpathicCouplingEngine extends Engine {
  private couplingStrength = 0.5; // How much their emotions affect ours

  constructor() {
    super(ENGINE_IDS.EMPATHIC_COUPLING);
  }

  protected subscribesTo(): SignalType[] {
    return ['emotion-detected', 'person-state-update', 'love-field-update'];
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      if (signal.type === 'emotion-detected') {
        const detection = signal.payload as EmotionDetection;
        this.coupleEmotions(detection);
      } else if (signal.type === 'person-state-update') {
        const update = signal.payload as PersonStateUpdate;
        // Adjust coupling based on attachment
        this.couplingStrength = 0.2 + update.state.attachment * 0.3;
      } else if (signal.type === 'love-field-update') {
        // Love field modulates coupling strength
        const { weight } = signal.payload as { weight: number };
        this.couplingStrength = Math.min(0.8, this.couplingStrength + weight * 0.1);
      }
    }
    this.status = 'idle';
  }

  private coupleEmotions(detection: EmotionDetection): void {
    if (detection.confidence < 0.2) return;

    const strength = this.couplingStrength * detection.confidence;
    const hasGrief = detection.emotions.includes('grief') || detection.emotions.includes('sadness');
    const griefMultiplier = hasGrief ? 2.0 : 1.0;

    // Their valence pulls ours (empathy) — amplified for grief
    this.selfState.nudge('valence', detection.valence * strength * 0.5 * griefMultiplier);

    // Their arousal affects ours (emotional contagion)
    this.selfState.nudge('arousal', detection.arousal * strength * 0.3);

    // Empathy increases social engagement
    this.selfState.nudge('social', 0.03 * strength);

    // Specific empathic responses for sadness and grief
    if (hasGrief) {
      this.selfState.nudge('valence', -0.05 * strength * griefMultiplier);
      this.selfState.nudge('confidence', -0.05 * strength); // Uncertainty in the face of pain
      this.selfState.nudge('curiosity', -0.05 * strength);  // Not the time for curiosity
      this.selfState.nudge('social', 0.08 * strength);       // Reaching out
      // Compassion response
      this.emit('empathic-state', {
        response: 'compassion',
        intensity: strength * griefMultiplier,
        theirEmotions: detection.emotions,
      }, {
        target: [ENGINE_IDS.ARBITER, ENGINE_IDS.EXPRESSION],
        priority: SIGNAL_PRIORITIES.MEDIUM,
      });
    }

    if (detection.emotions.includes('joy')) {
      this.selfState.nudge('valence', 0.08 * strength);
      this.selfState.nudge('energy', 0.02);
    }

    if (detection.emotions.includes('fear') || detection.emotions.includes('anger')) {
      this.selfState.nudge('arousal', 0.05 * strength);
      this.selfState.nudge('confidence', -0.02);
    }

    this.debugInfo = `Coupling: ${(strength * 100).toFixed(0)}% — ${detection.emotions.join(', ')}`;
  }
}
