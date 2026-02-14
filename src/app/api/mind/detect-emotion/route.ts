import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { extractJSON } from '@/lib/extract-json';

const client = new Anthropic();

export async function POST(request: Request) {
  try {
    const { text, context } = (await request.json()) as {
      text: string;
      context?: string;
    };

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: `You are an emotion detection system. Analyze the user's text for emotional content.
Return ONLY valid JSON with this exact structure:
{"emotions": ["emotion1", "emotion2"], "valence": 0.0, "arousal": 0.0, "confidence": 0.0}

- emotions: array of detected emotions (grief, joy, anger, fear, sadness, surprise, love, anxiety, loneliness, gratitude, hope, confusion, shame, guilt, pride, awe, disgust, contempt, jealousy, nostalgia)
- valence: -1.0 (very negative) to 1.0 (very positive)
- arousal: 0.0 (calm) to 1.0 (intense)
- confidence: 0.0 to 1.0 how confident you are

Consider sarcasm, context, implicit emotions, and tone. "Fine." after bad news = suppressed pain, not contentment.`,
      messages: [
        {
          role: 'user',
          content: context
            ? `Context: ${context}\n\nText to analyze: "${text}"`
            : `Text to analyze: "${text}"`,
        },
      ],
    });

    const responseText = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    const result = JSON.parse(extractJSON(responseText));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Detect emotion API error:', error);
    return NextResponse.json(
      { error: 'Failed to detect emotions', details: String(error) },
      { status: 500 }
    );
  }
}
