// Engine zones
export type Zone = 'outer' | 'inner' | 'thalamus' | 'body';

// All engine IDs
export const ENGINE_IDS = {
  // Outer (Left hemisphere — sensors & action)
  TEXT_INPUT: 'text-input',
  CAMERA: 'camera',
  MICROPHONE: 'microphone',
  SAFETY: 'safety',
  PERCEPTION: 'perception',
  MOTOR: 'motor',
  MEMORY: 'memory',

  // Inner (Right hemisphere — emotion & simulation)
  EMOTION_INFERENCE: 'emotion-inference',
  PERSON_STATE: 'person-state',
  TOM: 'tom',
  PERSPECTIVE: 'perspective',
  EMPATHIC_COUPLING: 'empathic-coupling',
  IMAGINATION: 'imagination',
  INTUITION: 'intuition',
  VALUES: 'values',
  STRATEGY: 'strategy',
  HOPE_WORRY: 'hope-worry',
  DEFAULT_MODE: 'default-mode',
  REPLAY: 'replay',
  LOVE_FIELD: 'love-field',

  // Thalamus (Center column — integration)
  ATTENTION: 'attention',
  BINDER: 'binder',
  ARBITER: 'arbiter',
  SYNC: 'sync',
  MEMORY_WRITE: 'memory-write',
  GROWTH: 'growth',

  // Body (Output)
  EXPRESSION: 'expression',
  VOICE: 'voice',
  LOCOMOTION: 'locomotion',
  PERSISTENCE: 'persistence',
} as const;

export type EngineId = (typeof ENGINE_IDS)[keyof typeof ENGINE_IDS];

// Tick intervals in ms — how often each engine processes
export const TICK_RATES: Record<EngineId, number> = {
  // Outer — fast sensors
  [ENGINE_IDS.TEXT_INPUT]: 16,       // Every frame
  [ENGINE_IDS.CAMERA]: 2000,         // 0.5fps to manage API cost
  [ENGINE_IDS.MICROPHONE]: 100,      // Audio chunks
  [ENGINE_IDS.SAFETY]: 16,           // Always watching
  [ENGINE_IDS.PERCEPTION]: 200,      // Process sensor data
  [ENGINE_IDS.MOTOR]: 100,           // Action planning
  [ENGINE_IDS.MEMORY]: 500,          // Retrieval

  // Inner — slower, reflective
  [ENGINE_IDS.EMOTION_INFERENCE]: 500,
  [ENGINE_IDS.PERSON_STATE]: 300,
  [ENGINE_IDS.TOM]: 2000,            // Claude-powered, slow
  [ENGINE_IDS.PERSPECTIVE]: 2000,    // Claude-powered, slow
  [ENGINE_IDS.EMPATHIC_COUPLING]: 200,
  [ENGINE_IDS.IMAGINATION]: 3000,    // Claude-powered
  [ENGINE_IDS.INTUITION]: 500,
  [ENGINE_IDS.VALUES]: 200,
  [ENGINE_IDS.STRATEGY]: 5000,       // Long-term planning
  [ENGINE_IDS.HOPE_WORRY]: 1000,
  [ENGINE_IDS.DEFAULT_MODE]: 5000,   // Idle wandering
  [ENGINE_IDS.REPLAY]: 10000,        // Dream cycles
  [ENGINE_IDS.LOVE_FIELD]: 1000,

  // Thalamus — moderate
  [ENGINE_IDS.ATTENTION]: 50,        // Fast saliency
  [ENGINE_IDS.BINDER]: 100,          // Cross-modal fusion
  [ENGINE_IDS.ARBITER]: 100,         // Decision making
  [ENGINE_IDS.SYNC]: 50,             // Temporal alignment
  [ENGINE_IDS.MEMORY_WRITE]: 500,    // Significance scoring
  [ENGINE_IDS.GROWTH]: 30000,        // Self-improvement

  // Body — variable
  [ENGINE_IDS.EXPRESSION]: 33,       // ~30fps face
  [ENGINE_IDS.VOICE]: 100,           // TTS
  [ENGINE_IDS.LOCOMOTION]: 200,      // Movement
  [ENGINE_IDS.PERSISTENCE]: 10000,   // Save to IndexedDB
};

// Engine zones mapping
export const ENGINE_ZONES: Record<EngineId, Zone> = {
  [ENGINE_IDS.TEXT_INPUT]: 'outer',
  [ENGINE_IDS.CAMERA]: 'outer',
  [ENGINE_IDS.MICROPHONE]: 'outer',
  [ENGINE_IDS.SAFETY]: 'outer',
  [ENGINE_IDS.PERCEPTION]: 'outer',
  [ENGINE_IDS.MOTOR]: 'outer',
  [ENGINE_IDS.MEMORY]: 'outer',

  [ENGINE_IDS.EMOTION_INFERENCE]: 'inner',
  [ENGINE_IDS.PERSON_STATE]: 'inner',
  [ENGINE_IDS.TOM]: 'inner',
  [ENGINE_IDS.PERSPECTIVE]: 'inner',
  [ENGINE_IDS.EMPATHIC_COUPLING]: 'inner',
  [ENGINE_IDS.IMAGINATION]: 'inner',
  [ENGINE_IDS.INTUITION]: 'inner',
  [ENGINE_IDS.VALUES]: 'inner',
  [ENGINE_IDS.STRATEGY]: 'inner',
  [ENGINE_IDS.HOPE_WORRY]: 'inner',
  [ENGINE_IDS.DEFAULT_MODE]: 'inner',
  [ENGINE_IDS.REPLAY]: 'inner',
  [ENGINE_IDS.LOVE_FIELD]: 'inner',

  [ENGINE_IDS.ATTENTION]: 'thalamus',
  [ENGINE_IDS.BINDER]: 'thalamus',
  [ENGINE_IDS.ARBITER]: 'thalamus',
  [ENGINE_IDS.SYNC]: 'thalamus',
  [ENGINE_IDS.MEMORY_WRITE]: 'thalamus',
  [ENGINE_IDS.GROWTH]: 'thalamus',

  [ENGINE_IDS.EXPRESSION]: 'body',
  [ENGINE_IDS.VOICE]: 'body',
  [ENGINE_IDS.LOCOMOTION]: 'body',
  [ENGINE_IDS.PERSISTENCE]: 'body',
};

// Engine display names
export const ENGINE_NAMES: Record<EngineId, string> = {
  [ENGINE_IDS.TEXT_INPUT]: 'Text Input',
  [ENGINE_IDS.CAMERA]: 'Camera',
  [ENGINE_IDS.MICROPHONE]: 'Microphone',
  [ENGINE_IDS.SAFETY]: 'Safety',
  [ENGINE_IDS.PERCEPTION]: 'Perception',
  [ENGINE_IDS.MOTOR]: 'Motor',
  [ENGINE_IDS.MEMORY]: 'Hippocampus',

  [ENGINE_IDS.EMOTION_INFERENCE]: 'Emotion Inference',
  [ENGINE_IDS.PERSON_STATE]: 'Person State',
  [ENGINE_IDS.TOM]: 'Theory of Mind',
  [ENGINE_IDS.PERSPECTIVE]: 'Perspective',
  [ENGINE_IDS.EMPATHIC_COUPLING]: 'Empathic Coupling',
  [ENGINE_IDS.IMAGINATION]: 'Imagination',
  [ENGINE_IDS.INTUITION]: 'Intuition',
  [ENGINE_IDS.VALUES]: 'Values',
  [ENGINE_IDS.STRATEGY]: 'Strategy',
  [ENGINE_IDS.HOPE_WORRY]: 'Hope & Worry',
  [ENGINE_IDS.DEFAULT_MODE]: 'Default Mode',
  [ENGINE_IDS.REPLAY]: 'Replay',
  [ENGINE_IDS.LOVE_FIELD]: 'Love Field',

  [ENGINE_IDS.ATTENTION]: 'Attention',
  [ENGINE_IDS.BINDER]: 'Binder',
  [ENGINE_IDS.ARBITER]: 'Arbiter',
  [ENGINE_IDS.SYNC]: 'Sync',
  [ENGINE_IDS.MEMORY_WRITE]: 'Memory Write',
  [ENGINE_IDS.GROWTH]: 'Growth',

  [ENGINE_IDS.EXPRESSION]: 'Expression',
  [ENGINE_IDS.VOICE]: 'Voice',
  [ENGINE_IDS.LOCOMOTION]: 'Locomotion',
  [ENGINE_IDS.PERSISTENCE]: 'Persistence',
};

// Signal priorities (higher = processed first)
export const SIGNAL_PRIORITIES = {
  CRITICAL: 100,   // Safety, system failures
  HIGH: 75,        // User input, active perception
  MEDIUM: 50,      // Inference, reasoning
  LOW: 25,         // Background processes
  IDLE: 10,        // Default mode, growth
} as const;

// Self-state dimension defaults
export const SELF_STATE_DEFAULTS = {
  valence: 0.6,     // Slightly positive
  arousal: 0.3,     // Calm
  confidence: 0.5,  // Neutral
  energy: 0.7,      // Ready
  social: 0.4,      // Mildly social
  curiosity: 0.6,   // Curious
} as const;

// Damping factor for exponential moving average (0-1, lower = slower change)
export const STATE_DAMPING = 0.35;

// Signal TTL in ms
export const SIGNAL_TTL = 10000;

// History ring buffer size
export const SIGNAL_HISTORY_SIZE = 200;

// Layout positions for brain map (normalized 0-1 coordinates)
export const ENGINE_POSITIONS: Record<EngineId, { x: number; y: number }> = {
  // Outer — left side
  [ENGINE_IDS.TEXT_INPUT]:   { x: 0.08, y: 0.25 },
  [ENGINE_IDS.CAMERA]:       { x: 0.08, y: 0.40 },
  [ENGINE_IDS.MICROPHONE]:   { x: 0.08, y: 0.55 },
  [ENGINE_IDS.SAFETY]:       { x: 0.15, y: 0.10 },
  [ENGINE_IDS.PERCEPTION]:   { x: 0.22, y: 0.35 },
  [ENGINE_IDS.MOTOR]:        { x: 0.22, y: 0.60 },
  [ENGINE_IDS.MEMORY]:       { x: 0.22, y: 0.80 },

  // Inner — right side
  [ENGINE_IDS.EMOTION_INFERENCE]:  { x: 0.78, y: 0.15 },
  [ENGINE_IDS.PERSON_STATE]:       { x: 0.85, y: 0.25 },
  [ENGINE_IDS.TOM]:                { x: 0.92, y: 0.35 },
  [ENGINE_IDS.PERSPECTIVE]:        { x: 0.92, y: 0.50 },
  [ENGINE_IDS.EMPATHIC_COUPLING]:  { x: 0.85, y: 0.40 },
  [ENGINE_IDS.IMAGINATION]:        { x: 0.78, y: 0.50 },
  [ENGINE_IDS.INTUITION]:          { x: 0.78, y: 0.65 },
  [ENGINE_IDS.VALUES]:             { x: 0.85, y: 0.55 },
  [ENGINE_IDS.STRATEGY]:           { x: 0.92, y: 0.65 },
  [ENGINE_IDS.HOPE_WORRY]:         { x: 0.85, y: 0.72 },
  [ENGINE_IDS.DEFAULT_MODE]:       { x: 0.78, y: 0.82 },
  [ENGINE_IDS.REPLAY]:             { x: 0.85, y: 0.88 },
  [ENGINE_IDS.LOVE_FIELD]:         { x: 0.92, y: 0.80 },

  // Thalamus — center
  [ENGINE_IDS.ATTENTION]:    { x: 0.50, y: 0.20 },
  [ENGINE_IDS.BINDER]:       { x: 0.43, y: 0.35 },
  [ENGINE_IDS.ARBITER]:      { x: 0.57, y: 0.35 },
  [ENGINE_IDS.SYNC]:         { x: 0.50, y: 0.50 },
  [ENGINE_IDS.MEMORY_WRITE]: { x: 0.43, y: 0.65 },
  [ENGINE_IDS.GROWTH]:       { x: 0.57, y: 0.65 },

  // Body — bottom center
  [ENGINE_IDS.EXPRESSION]:   { x: 0.38, y: 0.88 },
  [ENGINE_IDS.VOICE]:        { x: 0.50, y: 0.88 },
  [ENGINE_IDS.LOCOMOTION]:   { x: 0.62, y: 0.88 },
  [ENGINE_IDS.PERSISTENCE]:  { x: 0.50, y: 0.96 },
};

// Signal paths (edges between engines) — the ~80 connections
export const SIGNAL_PATHS: Array<[EngineId, EngineId]> = [
  // Sensor → Perception
  ['text-input', 'perception'],
  ['camera', 'perception'],
  ['microphone', 'perception'],

  // Perception → Attention & Emotion
  ['perception', 'attention'],
  ['perception', 'emotion-inference'],
  ['perception', 'safety'],

  // Attention → Integration
  ['attention', 'binder'],
  ['attention', 'memory'],

  // Binder → Decision
  ['binder', 'arbiter'],
  ['binder', 'tom'],
  ['binder', 'imagination'],

  // Arbiter → Output
  ['arbiter', 'voice'],
  ['arbiter', 'expression'],
  ['arbiter', 'motor'],
  ['arbiter', 'locomotion'],

  // Emotion pathways
  ['emotion-inference', 'person-state'],
  ['emotion-inference', 'empathic-coupling'],
  ['person-state', 'empathic-coupling'],
  ['empathic-coupling', 'arbiter'],
  ['empathic-coupling', 'expression'],

  // Theory of Mind
  ['tom', 'perspective'],
  ['tom', 'arbiter'],
  ['perspective', 'empathic-coupling'],
  ['perspective', 'strategy'],

  // Values & Strategy
  ['values', 'arbiter'],
  ['values', 'safety'],
  ['strategy', 'arbiter'],
  ['strategy', 'hope-worry'],

  // Inner world
  ['hope-worry', 'arbiter'],
  ['hope-worry', 'default-mode'],
  ['imagination', 'arbiter'],
  ['imagination', 'hope-worry'],
  ['intuition', 'attention'],
  ['intuition', 'arbiter'],
  ['default-mode', 'imagination'],
  ['default-mode', 'replay'],
  ['replay', 'memory-write'],
  ['replay', 'growth'],

  // Love field — modulates many
  ['love-field', 'empathic-coupling'],
  ['love-field', 'arbiter'],
  ['love-field', 'values'],
  ['love-field', 'expression'],

  // Memory pathways
  ['memory', 'binder'],
  ['memory', 'imagination'],
  ['memory-write', 'memory'],
  ['memory-write', 'persistence'],

  // Safety — can interrupt anything
  ['safety', 'arbiter'],
  ['safety', 'motor'],

  // Sync — coordinates outputs
  ['sync', 'voice'],
  ['sync', 'expression'],
  ['sync', 'locomotion'],

  // Growth — feeds back
  ['growth', 'strategy'],
  ['growth', 'values'],

  // Body outputs → Persistence
  ['persistence', 'memory-write'],

  // Motor → Locomotion
  ['motor', 'locomotion'],

  // Cross-hemisphere
  ['perception', 'person-state'],
  ['attention', 'emotion-inference'],
  ['binder', 'empathic-coupling'],
  ['memory', 'tom'],
  ['memory', 'default-mode'],

  // Consciousness stream — self-loop for thought chaining
  ['default-mode', 'default-mode'],
];

// Zone colors
export const ZONE_COLORS: Record<Zone, string> = {
  outer: '#3b82f6',     // Blue
  inner: '#a855f7',     // Purple
  thalamus: '#f59e0b',  // Amber
  body: '#10b981',      // Emerald
};
