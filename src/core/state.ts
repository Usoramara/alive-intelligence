import type { SelfState, SelfStateDimension } from './types';
import { SELF_STATE_DEFAULTS, STATE_DAMPING } from './constants';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class SelfStateManager {
  private current: SelfState;
  private target: SelfState;
  private listeners = new Set<() => void>();
  private cachedSnapshot: SelfState;

  constructor(initial?: Partial<SelfState>) {
    this.current = { ...SELF_STATE_DEFAULTS, ...initial };
    this.target = { ...this.current };
    this.cachedSnapshot = { ...this.current };
  }

  // Get the current (damped) state — returns a cached object (stable reference for useSyncExternalStore)
  get(): SelfState {
    return this.cachedSnapshot;
  }

  // Set target for a dimension — actual state will lerp toward it
  nudge(dimension: SelfStateDimension, delta: number): void {
    const min = dimension === 'valence' ? -1 : 0;
    this.target[dimension] = clamp(this.target[dimension] + delta, min, 1);
  }

  // Set target directly
  setTarget(dimension: SelfStateDimension, value: number): void {
    const min = dimension === 'valence' ? -1 : 0;
    this.target[dimension] = clamp(value, min, 1);
  }

  // Apply multiple nudges at once
  applyShift(shift: Partial<SelfState>): void {
    for (const [dim, delta] of Object.entries(shift)) {
      if (delta !== undefined) {
        this.nudge(dim as SelfStateDimension, delta);
      }
    }
  }

  // Called every frame — lerp current toward target
  update(): boolean {
    let changed = false;
    const dims: SelfStateDimension[] = ['valence', 'arousal', 'confidence', 'energy', 'social', 'curiosity'];

    for (const dim of dims) {
      const diff = this.target[dim] - this.current[dim];
      if (Math.abs(diff) > 0.001) {
        this.current[dim] += diff * STATE_DAMPING;
        changed = true;
      }
    }

    // Natural decay: arousal and social drift toward baseline
    this.target.arousal += (0.3 - this.target.arousal) * 0.001;
    this.target.social += (0.4 - this.target.social) * 0.001;
    // Energy slowly depletes
    this.target.energy = Math.max(0, this.target.energy - 0.0001);

    if (changed) {
      // Create a new frozen snapshot object so useSyncExternalStore sees the change
      this.cachedSnapshot = Object.freeze({ ...this.current });
      this.notifyListeners();
    }

    return changed;
  }

  // Subscribe to state changes (for useSyncExternalStore)
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  // Restore from persistence
  restore(state: SelfState): void {
    this.current = { ...state };
    this.target = { ...state };
    this.cachedSnapshot = Object.freeze({ ...this.current });
    this.notifyListeners();
  }
}
