import { Engine } from '../../engine';
import { ENGINE_IDS } from '../../constants';
import type { Signal, SignalType } from '../../types';

interface VoiceOutput {
  text: string;
  timestamp: number;
}

export type VoiceListener = (text: string) => void;

export class VoiceEngine extends Engine {
  private outputHistory: VoiceOutput[] = [];
  private listeners = new Set<VoiceListener>();

  constructor() {
    super(ENGINE_IDS.VOICE);
  }

  protected subscribesTo(): SignalType[] {
    return ['voice-output'];
  }

  // External code can listen to voice output (for the UI)
  onOutput(listener: VoiceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getHistory(): VoiceOutput[] {
    return [...this.outputHistory];
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      if (signal.type === 'voice-output') {
        const payload = signal.payload as VoiceOutput;
        this.outputHistory.push(payload);

        // Keep last 50 outputs
        if (this.outputHistory.length > 50) {
          this.outputHistory = this.outputHistory.slice(-50);
        }

        // Notify UI listeners
        for (const listener of this.listeners) {
          try {
            listener(payload.text);
          } catch (e) {
            console.error('Voice listener error:', e);
          }
        }

        // TTS will be added in Phase 7
        this.debugInfo = `Said: "${payload.text.slice(0, 30)}..."`;
      }
    }
    this.status = 'idle';
  }
}
