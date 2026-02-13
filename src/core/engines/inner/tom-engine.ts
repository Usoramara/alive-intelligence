import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType, SelfState } from '../../types';

interface BoundRepresentation {
  content: string;
  context: string[];
  selfState: SelfState;
  timestamp: number;
}

interface TomInference {
  thinking: string;
  feeling: string;
  wanting: string;
  confidence: number;
}

export class TomEngine extends Engine {
  private lastInference: TomInference | null = null;
  private lastInferenceTime = 0;
  private pendingContent: string | null = null;

  constructor() {
    super(ENGINE_IDS.TOM);
  }

  protected subscribesTo(): SignalType[] {
    return ['bound-representation', 'person-state-update', 'visual-description', 'memory-result'];
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      if (signal.type === 'bound-representation') {
        const bound = signal.payload as BoundRepresentation;
        this.pendingContent = bound.content;
      }
    }

    // Rate-limit ToM inferences (expensive Claude calls)
    if (this.pendingContent && Date.now() - this.lastInferenceTime > 3000) {
      this.infer(this.pendingContent);
      this.pendingContent = null;
    }

    this.status = 'idle';
  }

  private async infer(content: string): Promise<void> {
    this.status = 'waiting';
    this.lastInferenceTime = Date.now();

    try {
      const response = await fetch('/api/mind/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `Based on what this person just said: "${content}"\n\nBriefly infer:\n1. What they might be thinking (1 sentence)\n2. What they might be feeling (1 sentence)\n3. What they might want (1 sentence)\n\nRespond as JSON: {"thinking":"...","feeling":"...","wanting":"...","confidence":0.0-1.0}\nSHIFT: {"curiosity": 0.05}`,
          context: [],
          selfState: this.selfState.get(),
        }),
      });

      if (!response.ok) return;

      const result = await response.json();

      // Try to parse as TomInference
      try {
        const inference: TomInference = JSON.parse(result.text);
        this.lastInference = inference;

        this.emit('tom-inference', inference, {
          target: [ENGINE_IDS.PERSPECTIVE, ENGINE_IDS.ARBITER],
          priority: SIGNAL_PRIORITIES.MEDIUM,
        });

        this.selfState.nudge('curiosity', 0.03);
        this.debugInfo = `ToM: "${inference.thinking.slice(0, 30)}..."`;
      } catch {
        // Response wasn't valid JSON — use as freeform
        this.debugInfo = `ToM (raw): ${result.text.slice(0, 30)}`;
      }
    } catch (err) {
      this.debugInfo = `ToM error: ${err}`;
    }

    this.status = 'idle';
  }
}
