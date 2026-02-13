import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionType = any;

export class MicrophoneEngine extends Engine {
  private stream: MediaStream | null = null;
  private recognition: SpeechRecognitionType = null;
  private enabled = false;

  constructor() {
    super(ENGINE_IDS.MICROPHONE);
  }

  protected subscribesTo(): SignalType[] {
    return ['engine-status'];
  }

  async enable(): Promise<boolean> {
    try {
      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        this.debugInfo = 'Speech recognition not supported';
        return false;
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.recognition.onresult = (event: any) => {
        const last = event.results[event.results.length - 1];
        if (last.isFinal) {
          const text = last[0].transcript.trim();
          if (text) {
            this.emit('speech-text', {
              text,
              confidence: last[0].confidence,
              timestamp: Date.now(),
            }, {
              target: ENGINE_IDS.PERCEPTION,
              priority: SIGNAL_PRIORITIES.HIGH,
            });

            this.selfState.nudge('social', 0.05);
            this.selfState.nudge('arousal', 0.03);
            this.debugInfo = `Heard: "${text.slice(0, 30)}..."`;
          }
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          this.debugInfo = `Speech error: ${event.error}`;
        }
      };

      this.recognition.onend = () => {
        // Auto-restart if still enabled
        if (this.enabled && this.recognition) {
          try {
            this.recognition.start();
          } catch {
            // Already started
          }
        }
      };

      this.recognition.start();
      this.enabled = true;
      this.debugInfo = 'Microphone active';
      return true;
    } catch (err) {
      this.debugInfo = `Mic error: ${err}`;
      this.status = 'error';
      return false;
    }
  }

  disable(): void {
    this.enabled = false;
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.debugInfo = 'Microphone disabled';
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      if (signal.type === 'engine-status') {
        const cmd = signal.payload as { engine: string; action: string };
        if (cmd.engine === this.id) {
          if (cmd.action === 'enable') this.enable();
          else if (cmd.action === 'disable') this.disable();
        }
      }
    }
    this.status = 'idle';
  }

  destroy(): void {
    this.disable();
    super.destroy();
  }
}

// Augment Window type for webkit prefix
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}
