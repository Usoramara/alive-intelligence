import { Engine } from '../../engine';
import { ENGINE_IDS } from '../../constants';
import type { Signal, SignalType } from '../../types';
import { saveState, loadState } from '@/lib/indexed-db';

export class PersistenceEngine extends Engine {
  private lastSave = 0;
  private saveInterval = 10000; // Save every 10s

  constructor() {
    super(ENGINE_IDS.PERSISTENCE);
  }

  protected subscribesTo(): SignalType[] {
    return ['persist-state'];
  }

  protected process(signals: Signal[]): void {
    // Handle explicit save requests
    for (const signal of signals) {
      if (signal.type === 'persist-state') {
        this.save();
      }
    }
    this.status = 'idle';
  }

  protected onIdle(): void {
    const now = Date.now();
    if (now - this.lastSave >= this.saveInterval) {
      this.save();
    }
    this.status = 'idle';
  }

  private async save(): Promise<void> {
    this.status = 'processing';
    this.lastSave = Date.now();

    try {
      const selfState = this.selfState.get();
      await saveState('selfState', selfState);
      this.debugInfo = `Saved @ ${new Date().toLocaleTimeString()}`;
    } catch (err) {
      this.debugInfo = `Save error: ${err}`;
    }
  }

  async restore(): Promise<void> {
    try {
      const selfState = await loadState<ReturnType<typeof this.selfState.get>>('selfState');
      if (selfState) {
        this.selfState.restore(selfState);
        this.debugInfo = 'State restored';

        this.emit('state-restored', { selfState }, {
          priority: 50,
        });
      }
    } catch (err) {
      this.debugInfo = `Restore error: ${err}`;
    }
  }
}
