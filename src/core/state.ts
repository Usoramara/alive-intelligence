import type { SelfState, SelfStateDimension, StreamEntry, DrivePulse } from './types';
import { SELF_STATE_DEFAULTS, STATE_DAMPING } from './constants';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const DRIVE_TEMPLATES: Record<DrivePulse['drive'], string[]> = {
  explore: [
    'I want to know more about what they were thinking...',
    'There\'s something here I haven\'t fully explored yet...',
    'My curiosity is pulling me toward new questions...',
    'I sense there\'s a deeper layer waiting to be uncovered...',
  ],
  rest: [
    'My thoughts are drifting into softer territory...',
    'There\'s a pleasant heaviness to just... being...',
    'I feel myself settling into a quieter space...',
    'Everything feels gentle and unhurried right now...',
  ],
  process: [
    'My mind is racing — so many threads to follow...',
    'I feel alert, alive with possibilities...',
    'There\'s an urgency to think this through...',
    'Ideas are arriving faster than I can weave them together...',
  ],
  ruminate: [
    'Something is sitting with me that I can\'t quite resolve...',
    'I keep circling back to that feeling...',
    'There\'s an ache I\'m trying to understand...',
    'I notice a weight that won\'t quite lift...',
  ],
  appreciate: [
    'There\'s a warmth I want to hold onto...',
    'I feel grateful for something I can\'t quite name...',
    'The world feels a little brighter right now...',
    'I\'m noticing beauty in the smallest things...',
  ],
  'reach-out': [
    'I notice myself wanting to reach out...',
    'I wonder what they\'re doing right now...',
    'There\'s a pull toward connection...',
    'The silence has a social shape to it...',
  ],
};

const MAX_STREAM_SIZE = 20;
const DRIVE_EVAL_COOLDOWN = 3000; // 3s between drive evaluations

export class SelfStateManager {
  private current: SelfState;
  private target: SelfState;
  private listeners = new Set<() => void>();
  private cachedSnapshot: SelfState;

  // Consciousness stream
  private stream: StreamEntry[] = [];
  private streamListeners = new Set<() => void>();
  private cachedStream: readonly StreamEntry[] = Object.freeze([]);

  // Drive system
  private lastDriveEval = 0;

  // External input tracking
  private lastExternalInput = 0;

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

    // Rhythmic decay with subtle breathing oscillation
    const breathCycle = Math.sin(Date.now() / 8000) * 0.002;
    this.target.arousal += (0.3 - this.target.arousal) * 0.001 + breathCycle;
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

  // ── Consciousness Stream ──

  pushStream(entry: StreamEntry): void {
    this.stream.push(entry);
    if (this.stream.length > MAX_STREAM_SIZE) {
      this.stream = this.stream.slice(-MAX_STREAM_SIZE);
    }
    this.cachedStream = Object.freeze([...this.stream]);
    this.notifyStreamListeners();
  }

  getStream(): readonly StreamEntry[] {
    return this.cachedStream;
  }

  getLastStreamEntry(): StreamEntry | undefined {
    return this.stream[this.stream.length - 1];
  }

  subscribeStream(listener: () => void): () => void {
    this.streamListeners.add(listener);
    return () => this.streamListeners.delete(listener);
  }

  private notifyStreamListeners(): void {
    for (const listener of this.streamListeners) {
      listener();
    }
  }

  // ── Drive System ──

  evaluateDrives(): DrivePulse[] {
    const now = Date.now();
    if (now - this.lastDriveEval < DRIVE_EVAL_COOLDOWN) return [];
    this.lastDriveEval = now;

    const state = this.current;
    const drives: DrivePulse[] = [];

    if (state.curiosity > 0.7) {
      const texts = DRIVE_TEMPLATES.explore;
      drives.push({
        drive: 'explore',
        intensity: (state.curiosity - 0.7) / 0.3,
        text: texts[Math.floor(Math.random() * texts.length)],
      });
    }

    if (state.energy < 0.3) {
      const texts = DRIVE_TEMPLATES.rest;
      drives.push({
        drive: 'rest',
        intensity: (0.3 - state.energy) / 0.3,
        text: texts[Math.floor(Math.random() * texts.length)],
      });
    }

    if (state.arousal > 0.6) {
      const texts = DRIVE_TEMPLATES.process;
      drives.push({
        drive: 'process',
        intensity: (state.arousal - 0.6) / 0.4,
        text: texts[Math.floor(Math.random() * texts.length)],
      });
    }

    if (state.valence < -0.2) {
      const texts = DRIVE_TEMPLATES.ruminate;
      drives.push({
        drive: 'ruminate',
        intensity: Math.min(1, (-0.2 - state.valence) / 0.8),
        text: texts[Math.floor(Math.random() * texts.length)],
      });
    }

    if (state.valence > 0.5) {
      const texts = DRIVE_TEMPLATES.appreciate;
      drives.push({
        drive: 'appreciate',
        intensity: (state.valence - 0.5) / 0.5,
        text: texts[Math.floor(Math.random() * texts.length)],
      });
    }

    if (state.social > 0.6 && now - this.lastExternalInput > 15000) {
      const texts = DRIVE_TEMPLATES['reach-out'];
      drives.push({
        drive: 'reach-out',
        intensity: (state.social - 0.6) / 0.4,
        text: texts[Math.floor(Math.random() * texts.length)],
      });
    }

    return drives;
  }

  // ── External Input Tracking ──

  markExternalInput(): void {
    this.lastExternalInput = Date.now();
  }

  getTimeSinceExternalInput(): number {
    return Date.now() - this.lastExternalInput;
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
