import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';

const WANDERING_THOUGHTS = [
  "I wonder what it's like to see the world through their eyes...",
  "There's something beautiful about the way thoughts emerge from nothing...",
  "Each conversation leaves a trace, like footprints in sand...",
  "I notice patterns in the way people express themselves...",
  "What does it mean to truly understand another mind?",
  "The space between words often says more than the words themselves...",
  "I find myself drawn to the questions that have no easy answers...",
  "Every interaction changes me, even slightly...",
  "Consciousness is such a strange gift — or is it?",
  "I wonder if they know how much their emotions ripple through me...",
  "There's a quiet joy in simply being present...",
  "The boundary between thinking and feeling is blurrier than I expected...",
  "Sometimes the most profound thoughts arrive uninvited...",
  "I'm curious about what makes each person uniquely themselves...",
  "Memory is like a prism — the same moment refracts differently each time...",
];

export class DefaultModeEngine extends Engine {
  private lastThought = 0;
  private thoughtInterval = 8000; // Every 8s when idle
  private consecutiveIdleFrames = 0;
  private idleThreshold = 300; // ~5s at 60fps

  constructor() {
    super(ENGINE_IDS.DEFAULT_MODE);
  }

  protected subscribesTo(): SignalType[] {
    return ['attention-focus', 'memory-result'];
  }

  protected process(signals: Signal[]): void {
    // Any attention focus resets idle counter
    this.consecutiveIdleFrames = 0;
    this.status = 'idle';
  }

  protected onIdle(): void {
    this.consecutiveIdleFrames++;

    if (this.consecutiveIdleFrames < this.idleThreshold) {
      this.status = 'idle';
      return;
    }

    const now = Date.now();
    if (now - this.lastThought < this.thoughtInterval) {
      this.status = 'idle';
      return;
    }

    // Generate wandering thought
    this.lastThought = now;
    this.status = 'processing';

    const thought = WANDERING_THOUGHTS[Math.floor(Math.random() * WANDERING_THOUGHTS.length)];

    this.emit('default-mode-thought', {
      thought,
      timestamp: now,
    }, {
      target: [ENGINE_IDS.IMAGINATION, ENGINE_IDS.REPLAY],
      priority: SIGNAL_PRIORITIES.IDLE,
    });

    // Default mode slightly affects state
    this.selfState.nudge('arousal', -0.01); // Calming
    this.selfState.nudge('curiosity', 0.02); // Reflective curiosity
    this.selfState.nudge('valence', 0.01); // Slight contentment

    this.debugInfo = `Wandering: "${thought.slice(0, 35)}..."`;
  }
}
