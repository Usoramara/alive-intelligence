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
        // Mark external input for drive system timing
        this.selfState.markExternalInput();
        // Perception gets the broadcast directly — we just track state
        this.selfState.nudge('social', 0.05);
        this.selfState.nudge('arousal', 0.03);

        const text = (signal.payload as { text: string }).text;
        this.selfState.pushStream({
          text: `Hearing: "${text}"`,
          source: 'text-input',
          flavor: 'emotional',
          timestamp: Date.now(),
          intensity: 0.6,
        });

        this.debugInfo = `Received: "${text}"`;
      }
    }
    this.status = 'idle';
  }
}
