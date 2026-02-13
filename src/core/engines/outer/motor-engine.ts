import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';

export class MotorEngine extends Engine {
  constructor() {
    super(ENGINE_IDS.MOTOR);
  }

  protected subscribesTo(): SignalType[] {
    return ['action-decision', 'safety-alert', 'motor-command'];
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      if (signal.type === 'safety-alert') {
        // Safety override — halt all motor actions
        this.emit('locomotion-update', { action: 'halt', reason: 'safety' }, {
          target: ENGINE_IDS.LOCOMOTION,
          priority: SIGNAL_PRIORITIES.CRITICAL,
        });
        this.debugInfo = 'Motor halted (safety)';
      } else if (signal.type === 'motor-command') {
        const cmd = signal.payload as { action: string };
        this.emit('locomotion-update', cmd, {
          target: ENGINE_IDS.LOCOMOTION,
          priority: SIGNAL_PRIORITIES.MEDIUM,
        });
        this.debugInfo = `Motor: ${cmd.action}`;
      }
    }
    this.status = 'idle';
  }
}
