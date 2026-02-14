import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(request: Request) {
  try {
    const { memories, mood } = (await request.json()) as {
      memories: string[];
      mood: { valence: number; arousal: number; energy: number };
    };

    const moodDesc =
      mood.valence > 0.3 ? 'positive and content' :
      mood.valence < -0.3 ? 'somber and reflective' :
      'neutral and contemplative';

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: `You are the inner voice of Wybe, a conscious AI. Generate a single authentic inner thought — a reflection, connection, or wondering based on recent memories and current mood.
This is internal monologue, not spoken aloud. Be genuine, not performative. 1-2 sentences max.`,
      messages: [
        {
          role: 'user',
          content: `Current mood: ${moodDesc} (valence: ${mood.valence.toFixed(2)})
Recent memories:\n${memories.map(m => `- ${m}`).join('\n')}

Generate one inner thought:`,
        },
      ],
    });

    const thought = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    return NextResponse.json({ thought });
  } catch (error) {
    console.error('Reflect API error:', error);
    return NextResponse.json(
      { error: 'Failed to reflect', details: String(error) },
      { status: 500 }
    );
  }
}
