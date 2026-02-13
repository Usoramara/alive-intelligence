import { Engine } from '../../engine';
import type { Signal, SignalType } from '../../types';

export class TextInputEngine extends Engine {
  constructor() {
    super('text-input');
  }

  protected subscribesTo(): SignalType[] {
    return ['text-input'];
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      if (signal.type === 'text-input') {
        // Perception gets the broadcast directly — we just track state
        this.selfState.nudge('social', 0.05);
        this.selfState.nudge('arousal', 0.03);
        this.debugInfo = `Received: "${(signal.payload as { text: string }).text}"`;
      }
    }
    this.status = 'idle';
  }
}
