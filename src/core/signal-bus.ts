import type { Signal, SignalHandler, SignalType, Subscription } from './types';
import type { EngineId } from './constants';
import { SIGNAL_HISTORY_SIZE, SIGNAL_TTL } from './constants';

let signalCounter = 0;

export function createSignalId(): string {
  return `sig_${++signalCounter}_${Date.now()}`;
}

export class SignalBus {
  private queue: Signal[] = [];
  private subscriptions = new Map<string, Subscription>();
  private history: Signal[] = [];
  private historyIndex = 0;

  emit(signal: Omit<Signal, 'id' | 'timestamp' | 'ttl'> & { id?: string; timestamp?: number; ttl?: number }): Signal {
    const full: Signal = {
      id: signal.id ?? createSignalId(),
      type: signal.type,
      source: signal.source,
      target: signal.target,
      payload: signal.payload,
      priority: signal.priority,
      timestamp: signal.timestamp ?? Date.now(),
      ttl: signal.ttl ?? SIGNAL_TTL,
    };

    // Insert sorted by priority (highest first)
    const idx = this.queue.findIndex(s => s.priority < full.priority);
    if (idx === -1) {
      this.queue.push(full);
    } else {
      this.queue.splice(idx, 0, full);
    }

    return full;
  }

  subscribe(engineId: EngineId, signalTypes: SignalType[] | undefined, handler: SignalHandler): string {
    const id = `sub_${engineId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.subscriptions.set(id, { id, engineId, signalTypes, handler });
    return id;
  }

  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  // Process all signals in the queue, delivering to subscribers
  flush(): Signal[] {
    const now = Date.now();
    const processed: Signal[] = [];

    // Remove expired signals
    this.queue = this.queue.filter(s => now - s.timestamp < s.ttl);

    // Drain queue
    while (this.queue.length > 0) {
      const signal = this.queue.shift()!;
      processed.push(signal);

      // Record in history (ring buffer)
      if (this.history.length < SIGNAL_HISTORY_SIZE) {
        this.history.push(signal);
      } else {
        this.history[this.historyIndex] = signal;
        this.historyIndex = (this.historyIndex + 1) % SIGNAL_HISTORY_SIZE;
      }

      // Deliver to matching subscribers
      for (const sub of this.subscriptions.values()) {
        // Skip if signal is targeted to a different engine
        if (signal.target) {
          const targets = Array.isArray(signal.target) ? signal.target : [signal.target];
          if (!targets.includes(sub.engineId)) continue;
        }

        // Skip if subscriber filters by type and this doesn't match
        if (sub.signalTypes && !sub.signalTypes.includes(signal.type)) continue;

        try {
          sub.handler(signal);
        } catch (e) {
          console.error(`Signal handler error in ${sub.engineId}:`, e);
        }
      }
    }

    return processed;
  }

  // Get current queue (readonly)
  getQueue(): readonly Signal[] {
    return this.queue;
  }

  // Get history (ordered by recency)
  getHistory(): Signal[] {
    if (this.history.length < SIGNAL_HISTORY_SIZE) {
      return [...this.history];
    }
    // Ring buffer — reorder so newest is last
    return [
      ...this.history.slice(this.historyIndex),
      ...this.history.slice(0, this.historyIndex),
    ];
  }

  // Get pending signal count
  get pendingCount(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
    this.history = [];
    this.historyIndex = 0;
  }
}
