import type { Signal, SignalType, SelfState } from './types';
import type { SignalBus } from './signal-bus';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from './constants';

interface ActionDecision {
  action: string;
  content: string;
  context: string[];
  selfState: SelfState;
  timestamp: number;
  empathicState?: { mirroring: string; coupling: number; resonance: string };
  tomInference?: { theyFeel: string; theyWant: string; theyBelieve: string };
  recentMemories?: string[];
  detectedEmotions?: { emotions: string[]; valence: number; arousal: number; confidence: number };
  strategicPriority?: { description: string; priority: number; progress: number };
  recentInnerThoughts?: string[];
}

interface ConversationEntry {
  role: 'user' | 'assistant';
  content: string;
}

let activeInstance: ThoughtBridge | null = null;

/**
 * Bridges the client-side signal bus with the server-side Claude API.
 * Listens for 'thought' signals, sends them to /api/mind/think,
 * and injects the response back as 'claude-response' signals.
 */
export class ThoughtBridge {
  private bus: SignalBus;
  private subscriptionId: string;
  private conversationHistory: ConversationEntry[] = [];
  private processing = false;
  private lastProcessedContent = '';
  private lastProcessedTime = 0;

  constructor(bus: SignalBus) {
    // Destroy previous instance if exists (HMR/StrictMode safety)
    if (activeInstance) {
      activeInstance.destroy();
    }
    activeInstance = this;

    this.bus = bus;
    this.subscriptionId = bus.subscribe(
      ENGINE_IDS.ARBITER,  // Subscribe as arbiter to get thought signals
      ['thought'] as SignalType[],
      (signal) => this.handleThought(signal)
    );
  }

  private async handleThought(signal: Signal): Promise<void> {
    if (this.processing) return; // One at a time

    const decision = signal.payload as ActionDecision;

    // Deduplicate — skip if same content within 5s
    const now = Date.now();
    if (
      decision.content === this.lastProcessedContent &&
      now - this.lastProcessedTime < 5000
    ) {
      return;
    }
    this.lastProcessedContent = decision.content;
    this.lastProcessedTime = now;

    this.processing = true;

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: decision.content,
    });

    // Keep last 20 exchanges
    if (this.conversationHistory.length > 40) {
      this.conversationHistory = this.conversationHistory.slice(-40);
    }

    try {
      const response = await fetch('/api/mind/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: decision.content,
          context: decision.context,
          selfState: decision.selfState,
          conversationHistory: this.conversationHistory.slice(0, -1), // Exclude current
          empathicState: decision.empathicState,
          tomInference: decision.tomInference,
          recentMemories: decision.recentMemories,
          detectedEmotions: decision.detectedEmotions,
          strategicPriority: decision.strategicPriority,
          recentInnerThoughts: decision.recentInnerThoughts,
        }),
      });

      if (!response.ok) {
        throw new Error(`Think API returned ${response.status}`);
      }

      const result = await response.json();

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: result.text,
      });

      // Inject response back into signal bus — target both ARBITER and GROWTH
      this.bus.emit({
        type: 'claude-response',
        source: ENGINE_IDS.ARBITER,
        target: [ENGINE_IDS.ARBITER, ENGINE_IDS.GROWTH],
        payload: result,
        priority: SIGNAL_PRIORITIES.HIGH,
      });
    } catch (error) {
      console.error('ThoughtBridge error:', error);

      // Emit error response
      this.bus.emit({
        type: 'claude-response',
        source: ENGINE_IDS.ARBITER,
        target: [ENGINE_IDS.ARBITER, ENGINE_IDS.GROWTH],
        payload: {
          text: 'I... lost my train of thought for a moment. Could you say that again?',
          emotionShift: { confidence: -0.1, energy: -0.05 },
        },
        priority: SIGNAL_PRIORITIES.HIGH,
      });
    } finally {
      this.processing = false;
    }
  }

  getConversationHistory(): ConversationEntry[] {
    return [...this.conversationHistory];
  }

  destroy(): void {
    this.bus.unsubscribe(this.subscriptionId);
    if (activeInstance === this) {
      activeInstance = null;
    }
  }
}
