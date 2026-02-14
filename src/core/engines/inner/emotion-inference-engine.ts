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
  { pattern: /\b(happy|joy|glad|wonderful|great|amazing|love|excited|awesome|fantastic|brilliant|perfect|thrilled)\b/i, emotion: 'joy', valence: 0.4, arousal: 0.3 },
  { pattern: /\b(sad|unhappy|depressed|down|miserable|cry|crying|miss|missed|missing|heartbroken|hurt|pain|suffer|suffering|sorrow)\b/i, emotion: 'sadness', valence: -0.4, arousal: -0.2 },
  { pattern: /\b(angry|furious|mad|hate|rage|pissed|frustrated|annoyed|irritated|unfair|stupid|ridiculous)\b/i, emotion: 'anger', valence: -0.3, arousal: 0.5 },
  { pattern: /\b(afraid|scared|fear|terrified|anxious|worried|nervous|panic|dread|nightmare|horror|creepy|scary)\b/i, emotion: 'fear', valence: -0.3, arousal: 0.4 },
  { pattern: /\b(surprised|shock|wow|whoa|unexpected)\b/i, emotion: 'surprise', valence: 0.1, arousal: 0.4 },
  { pattern: /\b(disgusted|gross|eww|nasty|awful)\b/i, emotion: 'disgust', valence: -0.3, arousal: 0.2 },
  { pattern: /\b(grateful|thank|appreciate|blessed)\b/i, emotion: 'gratitude', valence: 0.5, arousal: 0.1 },
  { pattern: /\b(lonely|alone|isolated|abandoned)\b/i, emotion: 'loneliness', valence: -0.4, arousal: -0.1 },
  { pattern: /\b(curious|wonder|interesting|fascinated)\b/i, emotion: 'curiosity', valence: 0.2, arousal: 0.2 },
  { pattern: /\b(calm|peaceful|serene|relaxed|chill)\b/i, emotion: 'calm', valence: 0.3, arousal: -0.3 },
  { pattern: /\b(confused|lost|don't understand|what)\b/i, emotion: 'confusion', valence: -0.1, arousal: 0.1 },
  { pattern: /\b(hope|hopeful|optimistic|looking forward)\b/i, emotion: 'hope', valence: 0.3, arousal: 0.1 },
  { pattern: /\b(died|dead|death|passed away|funeral|mourn|mourning|gone forever|grief|griev|loss|lost someone)\b/i, emotion: 'grief', valence: -0.6, arousal: -0.3 },
];

export class EmotionInferenceEngine extends Engine {
  private lastHaikuCall = 0;
  private haikuCooldown = 2000; // 2s between Haiku calls

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
        // Emit to person state engine, empathic coupling, AND arbiter
        this.emit('emotion-detected', detection, {
          target: [ENGINE_IDS.PERSON_STATE, ENGINE_IDS.EMPATHIC_COUPLING, ENGINE_IDS.ARBITER],
          priority: SIGNAL_PRIORITIES.MEDIUM,
        });

        this.debugInfo = `Detected: ${detection.emotions.join(', ')} (v:${detection.valence.toFixed(2)})`;
      } else {
        this.debugInfo = 'No strong emotion detected';
      }

      // Fire-and-forget Haiku call for high-salience or ambiguous input
      const now = Date.now();
      const shouldCallHaiku =
        now - this.lastHaikuCall > this.haikuCooldown &&
        perception.content.length > 10 &&
        (perception.salience > 0.5 || detection.emotions.length === 0);

      if (shouldCallHaiku) {
        this.lastHaikuCall = now;
        this.detectWithHaiku(perception.content, detection);
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

  private async detectWithHaiku(text: string, regexResult: EmotionDetection): Promise<void> {
    try {
      const response = await fetch('/api/mind/detect-emotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) return;

      const haiku = (await response.json()) as EmotionDetection;

      // Merge: union of emotions, use Haiku values if more confident
      const mergedEmotions = [...new Set([...regexResult.emotions, ...haiku.emotions])];
      const useHaiku = haiku.confidence > regexResult.confidence;

      const merged: EmotionDetection = {
        emotions: mergedEmotions,
        valence: useHaiku ? haiku.valence : regexResult.valence,
        arousal: useHaiku ? haiku.arousal : regexResult.arousal,
        confidence: Math.max(regexResult.confidence, haiku.confidence),
      };

      // Emit supplemental detection with Haiku results
      this.emit('emotion-detected', merged, {
        target: [ENGINE_IDS.PERSON_STATE, ENGINE_IDS.EMPATHIC_COUPLING, ENGINE_IDS.ARBITER],
        priority: SIGNAL_PRIORITIES.MEDIUM,
      });

      this.debugInfo = `Haiku: ${merged.emotions.join(', ')} (v:${merged.valence.toFixed(2)}, c:${merged.confidence.toFixed(2)})`;
    } catch {
      // Fire-and-forget — don't let failures affect the pipeline
    }
  }
}
