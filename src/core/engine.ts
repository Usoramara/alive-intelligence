import type { EngineId, Zone } from './constants';
import { ENGINE_ZONES, TICK_RATES } from './constants';
import type { EngineSnapshot, EngineStatus, Signal, SignalType } from './types';
import type { SignalBus } from './signal-bus';
import type { SelfStateManager } from './state';

export abstract class Engine {
  readonly id: EngineId;
  readonly zone: Zone;
  readonly tickInterval: number;

  protected bus!: SignalBus;
  protected selfState!: SelfStateManager;
  protected status: EngineStatus = 'idle';
  protected lastTick = 0;
  protected tickCount = 0;
  protected signalsProcessed = 0;
  protected debugInfo?: string;
  protected inbox: Signal[] = [];
  private subscriptionId?: string;

  constructor(id: EngineId) {
    this.id = id;
    this.zone = ENGINE_ZONES[id];
    this.tickInterval = TICK_RATES[id];
  }

  // Called once by the cognitive loop to wire dependencies
  init(bus: SignalBus, selfState: SelfStateManager): void {
    this.bus = bus;
    this.selfState = selfState;

    // Subscribe to relevant signal types
    const types = this.subscribesTo();
    this.subscriptionId = bus.subscribe(this.id, types, (signal) => {
      this.inbox.push(signal);
    });
  }

  // Override to declare which signal types this engine listens to
  // Return undefined to receive all signals (broadcast)
  protected subscribesTo(): SignalType[] | undefined {
    return undefined;
  }

  // Called by the cognitive loop every tickInterval ms
  tick(now: number): void {
    if (now - this.lastTick < this.tickInterval) return;

    this.lastTick = now;
    this.tickCount++;

    if (this.inbox.length > 0) {
      this.status = 'processing';
      const signals = [...this.inbox];
      this.inbox = [];
      this.signalsProcessed += signals.length;

      try {
        this.process(signals);
      } catch (e) {
        this.status = 'error';
        this.debugInfo = String(e);
        console.error(`Engine ${this.id} error:`, e);
      }
    } else {
      this.onIdle();
    }
  }

  // Process incoming signals — override in subclass
  protected abstract process(signals: Signal[]): void;

  // Called when no signals are pending — override for background behavior
  protected onIdle(): void {
    this.status = 'idle';
  }

  // Emit a signal onto the bus
  protected emit(
    type: SignalType,
    payload: unknown,
    options?: { target?: EngineId | EngineId[]; priority?: number }
  ): Signal {
    return this.bus.emit({
      type,
      source: this.id,
      target: options?.target,
      payload,
      priority: options?.priority ?? 50,
    });
  }

  // Get snapshot for visualization
  snapshot(): EngineSnapshot {
    return {
      id: this.id,
      zone: this.zone,
      status: this.status,
      lastTick: this.lastTick,
      tickCount: this.tickCount,
      signalsProcessed: this.signalsProcessed,
      debugInfo: this.debugInfo,
    };
  }

  destroy(): void {
    if (this.subscriptionId) {
      this.bus.unsubscribe(this.subscriptionId);
    }
  }
}
