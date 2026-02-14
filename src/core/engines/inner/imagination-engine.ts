import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';

interface DefaultModeThought {
  thought: string;
  timestamp: number;
}

export class ImaginationEngine extends Engine {
  private lastSimulation = 0;
  private simulationCooldown = 5000;

  constructor() {
    super(ENGINE_IDS.IMAGINATION);
  }

  protected subscribesTo(): SignalType[] {
    return ['bound-representation', 'default-mode-thought', 'stream-thought', 'memory-result'];
  }

  protected process(signals: Signal[]): void {
    const now = Date.now();
    if (now - this.lastSimulation < this.simulationCooldown) {
      this.status = 'idle';
      return;
    }

    for (const signal of signals) {
      if (signal.type === 'stream-thought') {
        const payload = signal.payload as { thought: string };
        this.simulateFromThought(payload.thought);
        return;
      }

      if (signal.type === 'default-mode-thought') {
        const thought = signal.payload as DefaultModeThought;
        this.simulateFromThought(thought.thought);
        return;
      }

      if (signal.type === 'bound-representation') {
        const bound = signal.payload as { content: string };
        // Only simulate for substantial inputs
        if (bound.content.length > 20) {
          this.simulateFuture(bound.content);
          return;
        }
      }
    }

    this.status = 'idle';
  }

  private async simulateFuture(context: string): Promise<void> {
    this.status = 'processing';
    this.lastSimulation = Date.now();

    try {
      const response = await fetch('/api/mind/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `Given this context: "${context}"\n\nBriefly imagine one possible future scenario (1-2 sentences). What might happen next? What could go well or poorly?\nSHIFT: {"curiosity": 0.03}`,
          context: [],
          selfState: this.selfState.get(),
        }),
      });

      if (!response.ok) return;

      const result = await response.json();

      this.emit('imagination-result', {
        scenario: result.text,
        source: 'future-simulation',
        timestamp: Date.now(),
      }, {
        target: [ENGINE_IDS.ARBITER, ENGINE_IDS.HOPE_WORRY],
        priority: SIGNAL_PRIORITIES.LOW,
      });

      this.selfState.nudge('curiosity', 0.03);
      this.debugInfo = `Imagined: "${result.text.slice(0, 35)}..."`;
    } catch (err) {
      this.debugInfo = `Imagination error: ${err}`;
    }

    this.status = 'idle';
  }

  private simulateFromThought(thought: string): void {
    this.status = 'processing';
    this.lastSimulation = Date.now();

    // Local simulation (no API call) — extend the wandering thought
    const extensions = [
      'This could lead to deeper understanding...',
      'I imagine this unfolding in unexpected ways...',
      'What if I approached this from a different angle?',
      'There might be connections I haven\'t seen yet...',
    ];

    const extension = extensions[Math.floor(Math.random() * extensions.length)];

    this.emit('imagination-result', {
      scenario: `${thought} ${extension}`,
      source: 'thought-extension',
      timestamp: Date.now(),
    }, {
      target: ENGINE_IDS.HOPE_WORRY,
      priority: SIGNAL_PRIORITIES.IDLE,
    });

    this.debugInfo = `Extended thought`;
    this.status = 'idle';
  }
}
