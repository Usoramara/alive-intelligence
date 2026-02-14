import type { EngineId } from './constants';
import { SIGNAL_PRIORITIES } from './constants';
import type { MindSnapshot, Signal, SignalType } from './types';
import { SignalBus } from './signal-bus';
import { SelfStateManager } from './state';
import { Engine } from './engine';

export class CognitiveLoop {
  readonly bus: SignalBus;
  readonly selfState: SelfStateManager;

  private engines = new Map<EngineId, Engine>();
  private running = false;
  private rafId: number | null = null;
  private tickCount = 0;
  private lastActiveSignals: Signal[] = [];
  private listeners = new Set<() => void>();
  private currentSnapshot: MindSnapshot;
  private frameCounter = 0;
  private notifyEveryN = 3; // Only notify React every Nth frame to reduce renders

  constructor() {
    this.bus = new SignalBus();
    this.selfState = new SelfStateManager();
    // Initial snapshot
    this.currentSnapshot = {
      tick: 0,
      timestamp: Date.now(),
      selfState: this.selfState.get(),
      engines: new Map(),
      activeSignals: [],
      signalHistory: [],
      persons: new Map(),
    };
  }

  registerEngine(engine: Engine): void {
    engine.init(this.bus, this.selfState);
    this.engines.set(engine.id, engine);
    this.rebuildSnapshot();
  }

  getEngine<T extends Engine>(id: EngineId): T | undefined {
    return this.engines.get(id) as T | undefined;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.loop(performance.now());
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop = (now: number): void => {
    if (!this.running) return;

    this.tickCount++;
    this.frameCounter++;

    // 1. Tick all engines
    for (const engine of this.engines.values()) {
      engine.tick(now);
    }

    // 2. Flush signal bus — deliver all pending signals
    const processed = this.bus.flush();
    if (processed.length > 0) {
      this.lastActiveSignals = processed;
    }

    // 3. Update self-state (exponential moving average)
    const stateChanged = this.selfState.update();

    // 3b. Evaluate emotional drives and emit as signals + stream entries
    const drives = this.selfState.evaluateDrives();
    for (const drive of drives) {
      this.bus.emit({
        type: 'drive-pulse' as SignalType,
        source: 'attention',
        payload: drive,
        priority: SIGNAL_PRIORITIES.IDLE,
      });
      this.selfState.pushStream({
        text: drive.text,
        source: 'attention',
        flavor: 'urge',
        timestamp: Date.now(),
        intensity: drive.intensity,
      });
    }

    // 4. Only rebuild snapshot & notify React periodically or when something happened
    const hasActivity = processed.length > 0 || stateChanged;
    if (hasActivity || this.frameCounter >= this.notifyEveryN) {
      this.frameCounter = 0;
      this.rebuildSnapshot();
      this.notify();
    }

    // 5. Schedule next frame
    this.rafId = requestAnimationFrame(this.loop);
  };

  private rebuildSnapshot(): void {
    const engineSnapshots = new Map<EngineId, ReturnType<Engine['snapshot']>>();
    for (const [id, engine] of this.engines) {
      engineSnapshots.set(id, engine.snapshot());
    }

    this.currentSnapshot = {
      tick: this.tickCount,
      timestamp: Date.now(),
      selfState: this.selfState.get(),
      engines: engineSnapshots,
      activeSignals: this.lastActiveSignals,
      signalHistory: this.bus.getHistory(),
      persons: new Map(),
    };
  }

  // Returns cached snapshot — stable reference between rebuilds (for useSyncExternalStore)
  getSnapshot(): MindSnapshot {
    return this.currentSnapshot;
  }

  // Subscribe to frame updates (for useSyncExternalStore)
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  destroy(): void {
    this.stop();
    for (const engine of this.engines.values()) {
      engine.destroy();
    }
    this.engines.clear();
    this.bus.clear();
  }
}
