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
  private lastHaikuRecall = 0;
  private haikuCooldown = 5000; // 5s between Haiku recall calls

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
        this.recall(focus.content, focus.salience);
      } else if (signal.type === 'memory-query') {
        const query = signal.payload as { query: string };
        this.recall(query.query, 0.6); // memory-query implies moderate salience
      }
    }
  }

  private async recall(query: string, salience = 0): Promise<void> {
    this.status = 'processing';

    try {
      const results = await searchMemories(query, 5);
      this.recentRecalls = results;

      if (results.length > 0) {
        this.emit('memory-result', {
          items: results.map(r => r.content),
          records: results,
        }, {
          target: [ENGINE_IDS.BINDER, ENGINE_IDS.IMAGINATION, ENGINE_IDS.DEFAULT_MODE, ENGINE_IDS.ARBITER],
          priority: SIGNAL_PRIORITIES.MEDIUM,
        });

        this.debugInfo = `Recalled ${results.length} memories`;
      } else {
        this.debugInfo = 'No memories found';
      }

      // Fire-and-forget Haiku semantic recall for high-salience queries
      const now = Date.now();
      if (salience > 0.5 && now - this.lastHaikuRecall > this.haikuCooldown) {
        this.lastHaikuRecall = now;
        this.recallWithHaiku(query);
      }
    } catch (err) {
      this.debugInfo = `Recall error: ${err}`;
    }

    this.status = 'idle';
  }

  private async recallWithHaiku(query: string): Promise<void> {
    try {
      // Fetch a broader set of candidates from IndexedDB
      const candidates = await getMemories({ limit: 30 });
      if (candidates.length === 0) return;

      const response = await fetch('/api/mind/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          candidates: candidates.map(c => ({
            id: c.id,
            content: c.content,
            significance: c.significance,
          })),
        }),
      });

      if (!response.ok) return;

      const { ranked } = (await response.json()) as {
        ranked: Array<{ id: string; content: string; relevance: number }>;
      };

      if (ranked.length > 0) {
        // Emit supplemental semantic memory results
        this.emit('memory-result', {
          items: ranked.slice(0, 5).map(r => r.content),
          records: ranked.slice(0, 5),
          source: 'semantic',
        }, {
          target: [ENGINE_IDS.BINDER, ENGINE_IDS.IMAGINATION, ENGINE_IDS.DEFAULT_MODE, ENGINE_IDS.ARBITER],
          priority: SIGNAL_PRIORITIES.MEDIUM,
        });

        this.debugInfo = `Semantic recall: ${ranked.length} relevant memories`;
      }
    } catch {
      // Fire-and-forget — don't let failures affect the pipeline
    }
  }

  protected onIdle(): void {
    this.status = 'idle';
  }
}
