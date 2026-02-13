import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType, PersonState } from '../../types';

interface EmotionDetection {
  emotions: string[];
  valence: number;
  arousal: number;
  confidence: number;
}

const DEFAULT_PERSON_ID = 'human-0';

export class PersonStateEngine extends Engine {
  private persons = new Map<string, PersonState>();

  constructor() {
    super(ENGINE_IDS.PERSON_STATE);
  }

  protected subscribesTo(): SignalType[] {
    return ['emotion-detected', 'perception-result'];
  }

  getPersons(): Map<string, PersonState> {
    return new Map(this.persons);
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      if (signal.type === 'emotion-detected') {
        const detection = signal.payload as EmotionDetection;
        const person = this.getOrCreatePerson(DEFAULT_PERSON_ID);

        // Update person's emotional state with damping
        const alpha = 0.3;
        person.valence += (detection.valence - person.valence) * alpha;
        person.arousal += (detection.arousal - person.arousal) * alpha;
        person.lastSeen = Date.now();

        // Infer engagement from arousal
        person.engagement = Math.min(1, person.engagement + 0.05);

        // Emit updated state
        this.emit('person-state-update', {
          personId: DEFAULT_PERSON_ID,
          state: { ...person },
        }, {
          target: [ENGINE_IDS.EMPATHIC_COUPLING, ENGINE_IDS.TOM],
          priority: SIGNAL_PRIORITIES.MEDIUM,
        });

        this.debugInfo = `Human: v=${person.valence.toFixed(2)} a=${person.arousal.toFixed(2)}`;
      }
    }
    this.status = 'idle';
  }

  protected onIdle(): void {
    super.onIdle();
    // Decay engagement over time
    for (const person of this.persons.values()) {
      const timeSince = Date.now() - person.lastSeen;
      if (timeSince > 5000) {
        person.engagement = Math.max(0, person.engagement - 0.001);
      }
    }
  }

  private getOrCreatePerson(id: string): PersonState {
    let person = this.persons.get(id);
    if (!person) {
      person = {
        id,
        name: 'Human',
        valence: 0,
        arousal: 0.3,
        engagement: 0.5,
        trust: 0.5,
        openness: 0.5,
        stress: 0.3,
        familiarity: 0.1,
        warmth: 0.5,
        attachment: 0.3,
        curiosityAbout: 0.5,
        protectiveness: 0.3,
        admiration: 0.3,
        lastSeen: Date.now(),
      };
      this.persons.set(id, person);
    }
    return person;
  }
}
