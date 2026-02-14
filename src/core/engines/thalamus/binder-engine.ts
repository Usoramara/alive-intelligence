import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';

interface AttentionFocus {
  content: string;
  modality: string;
  salience: number;
  urgency: number;
  timestamp: number;
}

interface BoundRepresentation {
  content: string;
  context: string[];
  selfState: ReturnType<typeof import('../../state').SelfStateManager.prototype.get>;
  timestamp: number;
  needsClaude: boolean;
}

export class BinderEngine extends Engine {
  private recentFoci: AttentionFocus[] = [];
  private memoryContext: string[] = [];

  constructor() {
    super(ENGINE_IDS.BINDER);
  }

  protected subscribesTo(): SignalType[] {
    return ['attention-focus', 'memory-result', 'empathic-state'];
  }

  protected process(signals: Signal[]): void {
    let hasNewFocus = false;

    for (const signal of signals) {
      if (signal.type === 'attention-focus') {
        this.recentFoci.push(signal.payload as AttentionFocus);
        if (this.recentFoci.length > 5) this.recentFoci.shift();
        hasNewFocus = true;
      } else if (signal.type === 'memory-result') {
        const memories = signal.payload as { items: string[] };
        this.memoryContext = memories.items || [];
      }
    }

    // Only emit bound-representation when we have a NEW focus
    if (!hasNewFocus) return;

    const latestFocus = this.recentFoci[this.recentFoci.length - 1];
    if (!latestFocus) return;

    const bound: BoundRepresentation = {
      content: latestFocus.content,
      context: [
        ...this.memoryContext.slice(0, 3),
        ...this.recentFoci.slice(0, -1).map(f => f.content),
      ],
      selfState: this.selfState.get(),
      timestamp: Date.now(),
      // Need Claude for actual text responses
      needsClaude: latestFocus.modality === 'text' && latestFocus.content.length > 0,
    };

    // Forward to arbiter for action selection
    this.emit('bound-representation', bound, {
      target: ENGINE_IDS.ARBITER,
      priority: SIGNAL_PRIORITIES.HIGH,
    });

    // Also forward to ToM, Imagination, and Growth for deeper processing
    this.emit('bound-representation', bound, {
      target: [ENGINE_IDS.TOM, ENGINE_IDS.IMAGINATION, ENGINE_IDS.GROWTH],
      priority: SIGNAL_PRIORITIES.MEDIUM,
    });

    this.debugInfo = `Bound: "${latestFocus.content.slice(0, 20)}..." + ${this.memoryContext.length} ctx`;
    this.status = 'idle';
  }
}
