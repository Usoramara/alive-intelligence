import { Engine } from '../../engine';
import { ENGINE_IDS } from '../../constants';
import type { Signal, SignalType } from '../../types';

export interface ExpressionState {
  speaking: boolean;
  eyeTarget: { x: number; y: number };
  blinkRate: number; // blinks per minute
  microExpressions: string[];
}

export class ExpressionEngine extends Engine {
  private expressionState: ExpressionState = {
    speaking: false,
    eyeTarget: { x: 0.5, y: 0.5 },
    blinkRate: 15,
    microExpressions: [],
  };

  constructor() {
    super(ENGINE_IDS.EXPRESSION);
  }

  protected subscribesTo(): SignalType[] {
    return ['expression-update', 'empathic-state', 'love-field-update', 'voice-output'];
  }

  getExpressionState(): ExpressionState {
    return { ...this.expressionState };
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      if (signal.type === 'expression-update') {
        const update = signal.payload as Partial<ExpressionState>;
        Object.assign(this.expressionState, update);
      }

      if (signal.type === 'voice-output') {
        this.expressionState.speaking = true;
        // Reset speaking after estimated duration
        const text = (signal.payload as { text: string }).text;
        const duration = Math.max(1000, text.length * 50); // ~50ms per char
        setTimeout(() => {
          this.expressionState.speaking = false;
        }, duration);
      }

      if (signal.type === 'empathic-state') {
        const empathy = signal.payload as { response: string };
        if (empathy.response === 'compassion') {
          this.expressionState.microExpressions = ['softened_brows', 'slight_frown'];
        }
      }
    }

    // Adjust blink rate based on arousal
    const selfState = this.selfState.get();
    this.expressionState.blinkRate = 12 + selfState.arousal * 10;

    this.debugInfo = this.expressionState.speaking ? 'Speaking' :
      this.expressionState.microExpressions.length > 0 ?
        this.expressionState.microExpressions.join(', ') : 'Neutral';

    this.status = 'idle';
  }
}
