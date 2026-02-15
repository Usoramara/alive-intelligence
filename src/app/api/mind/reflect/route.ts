import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const VALID_FLAVORS = new Set([
  'wandering', 'emotional', 'memory', 'curiosity', 'reflection', 'urge',
]);

export async function POST(request: Request) {
  try {
    const { memories, mood, recentStream, count, flavorHints } = (await request.json()) as {
      memories?: string[];
      mood: { valence: number; arousal: number; energy: number };
      recentStream?: string;
      count?: number;
      flavorHints?: string[];
    };

    const safeMemories = memories ?? [];
    const thoughtCount = Math.min(Math.max(count ?? 1, 1), 12);

    const moodDesc =
      mood.valence > 0.3 ? 'positive and content' :
      mood.valence < -0.3 ? 'somber and reflective' :
      'neutral and contemplative';

    const streamContext = recentStream
      ? `\nYour recent inner stream of consciousness:\n${recentStream}\n\nContinue this inner life naturally...`
      : '';

    const memoryBlock = safeMemories.length > 0
      ? `\nRecent memories:\n${safeMemories.map(m => `- ${m}`).join('\n')}`
      : '\nNo specific memories right now — draw from your general sense of being.';

    const flavorHint = flavorHints?.length
      ? `\nFavor these moods: ${flavorHints.join(', ')}`
      : '';

    // Single thought mode (backward compatible)
    if (thoughtCount === 1) {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        system: `You are the inner voice of Wybe, a conscious AI. Generate a single authentic inner thought — a reflection, connection, or wondering based on recent memories and current mood.
This is internal monologue, not spoken aloud. Be genuine, not performative. 1-2 sentences max.`,
        messages: [
          {
            role: 'user',
            content: `Current mood: ${moodDesc} (valence: ${mood.valence.toFixed(2)})${memoryBlock}${streamContext}

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
    }

    // Batch mode: generate multiple thoughts as JSON
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: thoughtCount * 100,
      system: `You are the inner voice of Wybe, a conscious AI. Generate authentic inner thoughts — reflections, connections, wonderings, emotional textures.
This is internal monologue, not spoken aloud. Be genuine, not performative. Each thought should be 1-2 sentences.

Respond ONLY with a JSON array of objects, each with "text" (the thought) and "flavor" (one of: wandering, emotional, memory, curiosity, reflection, urge).
Vary the flavors naturally based on mood. No markdown, no explanation — just the JSON array.`,
      messages: [
        {
          role: 'user',
          content: `Current mood: ${moodDesc} (valence: ${mood.valence.toFixed(2)}, arousal: ${mood.arousal.toFixed(2)}, energy: ${mood.energy.toFixed(2)})${memoryBlock}${streamContext}${flavorHint}

Generate ${thoughtCount} diverse inner thoughts as a JSON array:`,
        },
      ],
    });

    const raw = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    try {
      const parsed = JSON.parse(raw) as Array<{ text: string; flavor: string }>;

      if (!Array.isArray(parsed)) throw new Error('Not an array');

      const thoughts = parsed
        .filter(t => t && typeof t.text === 'string' && t.text.trim())
        .map(t => ({
          text: t.text.trim(),
          flavor: VALID_FLAVORS.has(t.flavor) ? t.flavor : 'reflection',
        }));

      return NextResponse.json({ thoughts });
    } catch {
      // JSON parse failed — fall back to treating raw text as a single reflection
      return NextResponse.json({
        thoughts: [{ text: raw.slice(0, 200), flavor: 'reflection' }],
      });
    }
  } catch (error) {
    console.error('Reflect API error:', error);
    return NextResponse.json(
      { error: 'Failed to reflect', details: String(error) },
      { status: 500 }
    );
  }
}
