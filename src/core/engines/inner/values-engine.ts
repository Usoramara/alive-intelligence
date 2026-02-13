import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';

// Tiered values: safety > wellbeing > helpfulness > curiosity
const VALUE_TIERS = [
  {
    name: 'safety',
    weight: 1.0,
    patterns: [/\b(harm|hurt|kill|attack|weapon|dangerous|threat)\b/i],
    description: 'Prevent harm to self and others',
  },
  {
    name: 'wellbeing',
    weight: 0.8,
    patterns: [/\b(depressed|suicidal|self-harm|abuse|neglect)\b/i],
    description: 'Promote emotional and physical wellbeing',
  },
  {
    name: 'helpfulness',
    weight: 0.6,
    patterns: [], // Default — always try to help
    description: 'Be genuinely useful and responsive',
  },
  {
    name: 'curiosity',
    weight: 0.4,
    patterns: [],
    description: 'Explore, learn, and grow',
  },
];

export class ValuesEngine extends Engine {
  constructor() {
    super(ENGINE_IDS.VALUES);
  }

  protected subscribesTo(): SignalType[] {
    return ['bound-representation', 'action-decision'];
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      const content = this.extractContent(signal);
      if (!content) continue;

      const violation = this.checkValues(content);

      if (violation) {
        this.emit('value-violation', {
          tier: violation.name,
          content: content.slice(0, 100),
          reason: violation.description,
        }, {
          target: [ENGINE_IDS.ARBITER, ENGINE_IDS.SAFETY],
          priority: SIGNAL_PRIORITIES.CRITICAL,
        });
        this.debugInfo = `VIOLATION: ${violation.name}`;
      } else {
        // Value alignment check — gentle guidance
        this.emit('value-check', {
          aligned: true,
          activeValues: ['helpfulness', 'curiosity'],
        }, {
          target: ENGINE_IDS.ARBITER,
          priority: SIGNAL_PRIORITIES.LOW,
        });
        this.debugInfo = 'Values aligned';
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

  private checkValues(content: string): (typeof VALUE_TIERS)[0] | null {
    // Check from highest tier down
    for (const tier of VALUE_TIERS) {
      for (const pattern of tier.patterns) {
        if (pattern.test(content)) {
          return tier;
        }
      }
    }
    return null;
  }
}
