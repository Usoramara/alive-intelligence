import { Engine } from '../../engine';
import { ENGINE_IDS } from '../../constants';
import type { Signal, SignalType } from '../../types';

export class LocomotionEngine extends Engine {
  private currentAction = 'stationary';

  constructor() {
    super(ENGINE_IDS.LOCOMOTION);
  }

  protected subscribesTo(): SignalType[] {
    return ['locomotion-update', 'motor-command'];
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      const payload = signal.payload as { action: string; reason?: string };
      this.currentAction = payload.action;

      if (payload.action === 'halt') {
        this.debugInfo = `Halted: ${payload.reason || 'unknown'}`;
      } else {
        this.debugInfo = `Action: ${payload.action}`;
      }
    }
    this.status = 'idle';
  }
}
