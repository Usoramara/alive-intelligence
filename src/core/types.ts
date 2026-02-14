import type { EngineId, Zone } from './constants';

// ── Signal Types ──

export type SignalType =
  // Sensor signals
  | 'text-input'
  | 'camera-frame'
  | 'audio-chunk'
  | 'speech-text'
  // Perception signals
  | 'perception-result'
  | 'visual-description'
  | 'emotion-detected'
  // Attention signals
  | 'attention-focus'
  | 'saliency-map'
  // Integration signals
  | 'bound-representation'
  | 'action-decision'
  // Reasoning signals
  | 'thought'
  | 'claude-response'
  | 'tom-inference'
  | 'perspective-update'
  // Emotion signals
  | 'emotion-update'
  | 'person-state-update'
  | 'empathic-state'
  | 'valence-shift'
  // Inner world signals
  | 'imagination-result'
  | 'intuition-alert'
  | 'hope-worry-update'
  | 'strategy-update'
  | 'default-mode-thought'
  | 'replay-memory'
  | 'love-field-update'
  | 'growth-insight'
  // Values
  | 'value-check'
  | 'value-violation'
  // Memory signals
  | 'memory-query'
  | 'memory-result'
  | 'memory-write'
  | 'memory-significance'
  // Safety signals
  | 'safety-alert'
  | 'safety-clear'
  // Output signals
  | 'voice-output'
  | 'expression-update'
  | 'motor-command'
  | 'locomotion-update'
  // Consciousness stream signals
  | 'stream-thought'
  | 'drive-pulse'
  // System signals
  | 'engine-status'
  | 'persist-state'
  | 'state-restored';

export interface Signal<T = unknown> {
  id: string;
  type: SignalType;
  source: EngineId;
  target?: EngineId | EngineId[];  // undefined = broadcast
  payload: T;
  priority: number;
  timestamp: number;
  ttl: number;  // ms until expiry
}

// ── Consciousness Stream ──

export interface StreamEntry {
  text: string;
  source: string;
  flavor: 'wandering' | 'emotional' | 'memory' | 'curiosity' | 'reflection' | 'urge';
  timestamp: number;
  intensity: number; // 0-1
}

export interface DrivePulse {
  drive: 'explore' | 'rest' | 'process' | 'ruminate' | 'appreciate' | 'reach-out';
  intensity: number;
  text: string;
}

// ── Self State ──

export interface SelfState {
  valence: number;     // -1 (negative) to 1 (positive)
  arousal: number;     // 0 (calm) to 1 (excited)
  confidence: number;  // 0 (uncertain) to 1 (certain)
  energy: number;      // 0 (depleted) to 1 (full)
  social: number;      // 0 (withdrawn) to 1 (engaged)
  curiosity: number;   // 0 (bored) to 1 (fascinated)
}

export type SelfStateDimension = keyof SelfState;

// ── Person State ──

// 12-dimensional state vector per known person
export interface PersonState {
  id: string;
  name: string;
  // Observed emotional state
  valence: number;
  arousal: number;
  // Inferred mental states
  engagement: number;
  trust: number;
  openness: number;
  stress: number;
  // Relationship
  familiarity: number;
  warmth: number;
  // Wybe's feelings toward this person
  attachment: number;
  curiosityAbout: number;
  protectiveness: number;
  admiration: number;
  // Last interaction
  lastSeen: number;
}

// ── Engine Types ──

export type EngineStatus = 'idle' | 'processing' | 'waiting' | 'error';

export interface EngineSnapshot {
  id: EngineId;
  zone: Zone;
  status: EngineStatus;
  lastTick: number;
  tickCount: number;
  signalsProcessed: number;
  debugInfo?: string;
}

// ── Mind Snapshot ──

export interface MindSnapshot {
  tick: number;
  timestamp: number;
  selfState: SelfState;
  engines: Map<EngineId, EngineSnapshot>;
  activeSignals: Signal[];
  signalHistory: Signal[];
  persons: Map<string, PersonState>;
}

// ── Subscription Types ──

export type SignalHandler = (signal: Signal) => void;

export interface Subscription {
  id: string;
  engineId: EngineId;
  signalTypes?: SignalType[];
  handler: SignalHandler;
}

// ── Claude Integration ──

export interface ThinkRequest {
  prompt: string;
  systemPrompt?: string;
  selfState: SelfState;
  recentSignals: Signal[];
  personContext?: PersonState;
}

export interface ThinkResponse {
  text: string;
  emotionShift?: Partial<SelfState>;
  signals?: Array<{
    type: SignalType;
    payload: unknown;
  }>;
}

export interface PerceiveRequest {
  frame: string;  // base64 image
  selfState: SelfState;
  context?: string;
}

export interface PerceiveResponse {
  description: string;
  emotions?: {
    detected: string[];
    confidence: number;
  };
  objects?: string[];
  people?: Array<{
    expression: string;
    estimatedMood: string;
  }>;
}
