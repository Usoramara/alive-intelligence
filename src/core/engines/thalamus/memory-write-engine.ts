import { Engine } from '../../engine';
import { ENGINE_IDS } from '../../constants';
import type { Signal, SignalType } from '../../types';
import { saveMemory, type MemoryRecord } from '@/lib/indexed-db';

interface MemorySignificance {
  content: string;
  type: string;
  significance: number;
  tags?: string[];
}

export class MemoryWriteEngine extends Engine {
  private writeQueue: MemorySignificance[] = [];
  private significanceThreshold = 0.4;

  constructor() {
    super(ENGINE_IDS.MEMORY_WRITE);
  }

  protected subscribesTo(): SignalType[] {
    return ['memory-significance', 'memory-write', 'replay-memory'];
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      if (signal.type === 'memory-significance') {
        const item = signal.payload as MemorySignificance;
        if (item.significance >= this.significanceThreshold) {
          this.writeQueue.push(item);
        }
      } else if (signal.type === 'memory-write') {
        const item = signal.payload as MemorySignificance;
        this.writeQueue.push(item);
      }
    }

    // Batch write
    if (this.writeQueue.length > 0) {
      this.flushWrites();
    }

    this.status = 'idle';
  }

  private async flushWrites(): Promise<void> {
    const items = [...this.writeQueue];
    this.writeQueue = [];

    for (const item of items) {
      const record: MemoryRecord = {
        id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: this.classifyType(item.type),
        content: item.content,
        timestamp: Date.now(),
        significance: item.significance,
        tags: item.tags ?? [],
      };

      try {
        await saveMemory(record);
      } catch (err) {
        console.error('Memory write error:', err);
      }
    }

    this.debugInfo = `Wrote ${items.length} memories`;
  }

  private classifyType(type: string): MemoryRecord['type'] {
    switch (type) {
      case 'response':
      case 'conversation':
      case 'interaction':
        return 'episodic';
      case 'fact':
      case 'knowledge':
        return 'semantic';
      case 'person':
        return 'person';
      default:
        return 'episodic';
    }
  }
}
