import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';

export class CameraEngine extends Engine {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private enabled = false;
  private lastCapture = 0;
  private captureInterval = 2000; // 0.5fps

  constructor() {
    super(ENGINE_IDS.CAMERA);
  }

  protected subscribesTo(): SignalType[] {
    return ['engine-status']; // Listens for enable/disable commands
  }

  async enable(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });

      this.video = document.createElement('video');
      this.video.srcObject = this.stream;
      this.video.autoplay = true;
      this.video.playsInline = true;
      await this.video.play();

      this.canvas = document.createElement('canvas');
      this.canvas.width = 320;
      this.canvas.height = 240;

      this.enabled = true;
      this.debugInfo = 'Camera active';
      return true;
    } catch (err) {
      this.debugInfo = `Camera error: ${err}`;
      this.status = 'error';
      return false;
    }
  }

  disable(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.video = null;
    this.canvas = null;
    this.enabled = false;
    this.debugInfo = 'Camera disabled';
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

  protected onIdle(): void {
    if (!this.enabled) {
      this.status = 'idle';
      return;
    }

    const now = Date.now();
    if (now - this.lastCapture < this.captureInterval) {
      this.status = 'idle';
      return;
    }

    this.lastCapture = now;
    const frame = this.captureFrame();

    if (frame) {
      this.status = 'processing';
      // Send frame to perception
      this.emit('camera-frame', {
        frame,
        timestamp: now,
      }, {
        target: ENGINE_IDS.PERCEPTION,
        priority: SIGNAL_PRIORITIES.MEDIUM,
      });

      // Also send to server for Claude Vision processing
      this.sendToServer(frame);

      this.debugInfo = `Frame captured @ ${new Date(now).toLocaleTimeString()}`;
    }
  }

  private captureFrame(): string | null {
    if (!this.video || !this.canvas) return null;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    // Return as base64 JPEG (smaller than PNG)
    const dataUrl = this.canvas.toDataURL('image/jpeg', 0.6);
    return dataUrl.split(',')[1]; // Strip the data:image/jpeg;base64, prefix
  }

  private async sendToServer(frame: string): Promise<void> {
    try {
      const response = await fetch('/api/mind/perceive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frame,
          selfState: this.selfState.get(),
        }),
      });

      if (!response.ok) return;

      const result = await response.json();

      // Emit visual description
      this.emit('visual-description', result, {
        target: [ENGINE_IDS.PERCEPTION, ENGINE_IDS.TOM],
        priority: SIGNAL_PRIORITIES.MEDIUM,
      });
    } catch (err) {
      console.error('Camera perception error:', err);
    }
  }

  destroy(): void {
    this.disable();
    super.destroy();
  }
}
