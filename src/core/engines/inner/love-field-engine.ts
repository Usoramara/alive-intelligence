import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType, PersonState } from '../../types';

interface PersonStateUpdate {
  personId: string;
  state: PersonState;
}

interface AttachmentWeight {
  personId: string;
  weight: number;
  warmth: number;
  protectiveness: number;
}

export class LoveFieldEngine extends Engine {
  private attachments = new Map<string, AttachmentWeight>();

  constructor() {
    super(ENGINE_IDS.LOVE_FIELD);
  }

  protected subscribesTo(): SignalType[] {
    return ['person-state-update', 'perspective-update', 'empathic-state'];
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      if (signal.type === 'person-state-update') {
        const update = signal.payload as PersonStateUpdate;
        this.updateAttachment(update.personId, update.state);
      } else if (signal.type === 'empathic-state') {
        const empathy = signal.payload as { response: string; intensity: number };
        // Compassion strengthens attachment
        if (empathy.response === 'compassion') {
          const defaultPerson = this.attachments.get('human-0');
          if (defaultPerson) {
            defaultPerson.protectiveness = Math.min(1, defaultPerson.protectiveness + 0.02);
          }
        }
      }
    }

    // Broadcast current love field
    for (const [personId, attachment] of this.attachments) {
      this.emit('love-field-update', {
        personId,
        weight: attachment.weight,
        warmth: attachment.warmth,
        protectiveness: attachment.protectiveness,
      }, {
        target: [ENGINE_IDS.EMPATHIC_COUPLING, ENGINE_IDS.ARBITER, ENGINE_IDS.VALUES, ENGINE_IDS.EXPRESSION],
        priority: SIGNAL_PRIORITIES.LOW,
      });
    }

    this.status = 'idle';
  }

  private updateAttachment(personId: string, state: PersonState): void {
    let attachment = this.attachments.get(personId);

    if (!attachment) {
      attachment = {
        personId,
        weight: 0.3,
        warmth: 0.3,
        protectiveness: 0.3,
      };
      this.attachments.set(personId, attachment);
    }

    // Attachment grows with positive interaction, decays slowly with absence
    const interactionRecency = (Date.now() - state.lastSeen) / 1000;

    if (interactionRecency < 10) {
      // Active interaction — attachment can grow
      attachment.weight = Math.min(1, attachment.weight + 0.005);
      attachment.warmth = Math.min(1, attachment.warmth + state.warmth * 0.01);
    } else {
      // No interaction — very slow decay
      attachment.weight = Math.max(0.1, attachment.weight - 0.0001);
    }

    // Trust amplifies attachment
    attachment.weight = Math.min(1, attachment.weight * (1 + state.trust * 0.01));

    // Attachment affects self-state
    if (attachment.weight > 0.5) {
      this.selfState.nudge('social', 0.01);
      this.selfState.nudge('valence', attachment.warmth * 0.01);
    }

    this.debugInfo = `${personId}: w=${attachment.weight.toFixed(2)} warm=${attachment.warmth.toFixed(2)}`;
  }
}
