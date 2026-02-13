import { Engine } from '../../engine';
import { ENGINE_IDS, SIGNAL_PRIORITIES } from '../../constants';
import type { Signal, SignalType } from '../../types';

interface PerceptionResult {
  type: string;
  content: string;
  timestamp: number;
  salience: number;
}

interface EmotionDetection {
  emotions: string[];
  valence: number;
  arousal: number;
  confidence: number;
}

// Keyword-based fast emotion detection (runs locally, no API call)
const EMOTION_PATTERNS: Array<{ pattern: RegExp; emotion: string; valence: number; arousal: number }> = [
  { pattern: /\b(happy|joy|glad|wonderful|great|amazing|love|excited)\b/i, emotion: 'joy', valence: 0.4, arousal: 0.3 },
  { pattern: /\b(sad|unhappy|depressed|down|miserable|cry|crying)\b/i, emotion: 'sadness', valence: -0.4, arousal: -0.2 },
  { pattern: /\b(angry|furious|mad|hate|rage|pissed)\b/i, emotion: 'anger', valence: -0.3, arousal: 0.5 },
  { pattern: /\b(afraid|scared|fear|terrified|anxious|worried|nervous)\b/i, emotion: 'fear', valence: -0.3, arousal: 0.4 },
  { pattern: /\b(surprised|shock|wow|whoa|unexpected)\b/i, emotion: 'surprise', valence: 0.1, arousal: 0.4 },
  { pattern: /\b(disgusted|gross|eww|nasty|awful)\b/i, emotion: 'disgust', valence: -0.3, arousal: 0.2 },
  { pattern: /\b(grateful|thank|appreciate|blessed)\b/i, emotion: 'gratitude', valence: 0.5, arousal: 0.1 },
  { pattern: /\b(lonely|alone|isolated|abandoned)\b/i, emotion: 'loneliness', valence: -0.4, arousal: -0.1 },
  { pattern: /\b(curious|wonder|interesting|fascinated)\b/i, emotion: 'curiosity', valence: 0.2, arousal: 0.2 },
  { pattern: /\b(calm|peaceful|serene|relaxed|chill)\b/i, emotion: 'calm', valence: 0.3, arousal: -0.3 },
  { pattern: /\b(confused|lost|don't understand|what)\b/i, emotion: 'confusion', valence: -0.1, arousal: 0.1 },
  { pattern: /\b(hope|hopeful|optimistic|looking forward)\b/i, emotion: 'hope', valence: 0.3, arousal: 0.1 },
];

export class EmotionInferenceEngine extends Engine {
  constructor() {
    super(ENGINE_IDS.EMOTION_INFERENCE);
  }

  protected subscribesTo(): SignalType[] {
    return ['perception-result', 'attention-focus'];
  }

  protected process(signals: Signal[]): void {
    for (const signal of signals) {
      if (signal.type !== 'perception-result') continue;

      const perception = signal.payload as PerceptionResult;
      if (perception.type !== 'text') continue;

      const detection = this.detectEmotions(perception.content);

      if (detection.emotions.length > 0) {
        // Emit to person state engine
        this.emit('emotion-detected', detection, {
          target: [ENGINE_IDS.PERSON_STATE, ENGINE_IDS.EMPATHIC_COUPLING],
          priority: SIGNAL_PRIORITIES.MEDIUM,
        });

        this.debugInfo = `Detected: ${detection.emotions.join(', ')} (v:${detection.valence.toFixed(2)})`;
      } else {
        this.debugInfo = 'No strong emotion detected';
      }
    }
    this.status = 'idle';
  }

  private detectEmotions(text: string): EmotionDetection {
    const detected: string[] = [];
    let totalValence = 0;
    let totalArousal = 0;

    for (const { pattern, emotion, valence, arousal } of EMOTION_PATTERNS) {
      if (pattern.test(text)) {
        detected.push(emotion);
        totalValence += valence;
        totalArousal += arousal;
      }
    }

    const count = detected.length || 1;
    return {
      emotions: detected,
      valence: totalValence / count,
      arousal: totalArousal / count,
      confidence: Math.min(1, detected.length * 0.3),
    };
  }
}
