import { Engine } from '../../engine';
import { ENGINE_IDS } from '../../constants';
import type { Signal, SignalType } from '../../types';

export class SyncEngine extends Engine {
  private outputTimestamps = new Map<string, number>();

  constructor() {
    super(ENGINE_IDS.SYNC);
  }

  protected subscribesTo(): SignalType[] {
    return ['voice-output', 'expression-update', 'locomotion-update'];
  }

  protected process(signals: Signal[]): void {
    const now = Date.now();

    for (const signal of signals) {
      this.outputTimestamps.set(signal.type, now);
    }

    // Check temporal alignment — all outputs should be within 200ms
    const timestamps = Array.from(this.outputTimestamps.values());
    if (timestamps.length > 1) {
      const maxDiff = Math.max(...timestamps) - Math.min(...timestamps);
      if (maxDiff > 200) {
        this.debugInfo = `Desync: ${maxDiff}ms`;
      } else {
        this.debugInfo = `Synced: ${maxDiff}ms`;
      }
    }

    this.status = 'idle';
  }
}
