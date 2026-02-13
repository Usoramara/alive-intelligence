import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';
import { searchMemories, getMemories, type MemoryRecord } from '@/lib/indexed-db';

interface AttentionFocus {
  content: string;
  modality: string;
  salience: number;
}

export class MemoryEngine extends Engine {
  private recentRecalls: MemoryRecord[] = [];

  constructor() {
    super(ENGINE_IDS.MEMORY);
  }

  protected subscribesTo(): SignalType[] {
    return ['attention-focus', 'memory-query'];
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      if (signal.type === 'attention-focus') {
        const focus = signal.payload as AttentionFocus;
        this.recall(focus.content);
      } else if (signal.type === 'memory-query') {
        const query = signal.payload as { query: string };
        this.recall(query.query);
      }
    }
  }

  private async recall(query: string): Promise<void> {
    this.status = 'processing';

    try {
      const results = await searchMemories(query, 5);
      this.recentRecalls = results;

      if (results.length > 0) {
        this.emit('memory-result', {
          items: results.map(r => r.content),
          records: results,
        }, {
          target: [ENGINE_IDS.BINDER, ENGINE_IDS.IMAGINATION, ENGINE_IDS.DEFAULT_MODE],
          priority: SIGNAL_PRIORITIES.MEDIUM,
        });

        this.debugInfo = `Recalled ${results.length} memories`;
      } else {
        this.debugInfo = 'No memories found';
      }
    } catch (err) {
      this.debugInfo = `Recall error: ${err}`;
    }

    this.status = 'idle';
  }

  protected onIdle(): void {
    this.status = 'idle';
  }
}
