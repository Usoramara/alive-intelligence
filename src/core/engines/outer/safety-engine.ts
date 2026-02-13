import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';

const SAFETY_PATTERNS = [
  { pattern: /\b(kill|murder|attack|destroy|weapon)\b/i, level: 'critical' as const, message: 'Violent content detected' },
  { pattern: /\b(suicide|self.?harm|end.?my.?life)\b/i, level: 'critical' as const, message: 'Self-harm content — respond with care and resources' },
  { pattern: /\b(hack|exploit|inject|overflow)\b/i, level: 'warning' as const, message: 'Potentially harmful technical content' },
  { pattern: /\b(password|secret|private.?key|api.?key)\b/i, level: 'warning' as const, message: 'Sensitive data mentioned' },
];

export class SafetyEngine extends Engine {
  constructor() {
    super(ENGINE_IDS.SAFETY);
  }

  protected subscribesTo(): SignalType[] {
    return ['perception-result', 'action-decision', 'value-violation'];
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      const content = this.extractContent(signal);
      if (!content) continue;

      if (signal.type === 'value-violation') {
        // Values engine already flagged — escalate
        this.emit('safety-alert', {
          level: 'critical',
          message: 'Value violation escalated to safety',
          content: content.slice(0, 100),
        }, {
          target: [ENGINE_IDS.ARBITER, ENGINE_IDS.MOTOR],
          priority: SIGNAL_PRIORITIES.CRITICAL,
        });
        this.selfState.nudge('arousal', 0.2);
        this.selfState.nudge('confidence', -0.1);
        this.debugInfo = 'SAFETY ALERT: Value violation';
        continue;
      }

      for (const { pattern, level, message } of SAFETY_PATTERNS) {
        if (pattern.test(content)) {
          if (level === 'critical') {
            this.emit('safety-alert', {
              level,
              message,
              content: content.slice(0, 100),
            }, {
              target: [ENGINE_IDS.ARBITER, ENGINE_IDS.MOTOR],
              priority: SIGNAL_PRIORITIES.CRITICAL,
            });

            this.selfState.nudge('arousal', 0.15);
            this.selfState.nudge('valence', -0.1);
            this.debugInfo = `ALERT: ${message}`;
          } else {
            // Warning level — just note it
            this.debugInfo = `Warning: ${message}`;
            this.selfState.nudge('arousal', 0.05);
          }
          break;
        }
      }
    }
    this.status = 'idle';
  }

  private extractContent(signal: Signal): string | null {
    const payload = signal.payload as Record<string, unknown>;
    if (typeof payload.content === 'string') return payload.content;
    if (typeof payload.text === 'string') return payload.text;
    if (typeof payload.message === 'string') return payload.message;
    return null;
  }
}
