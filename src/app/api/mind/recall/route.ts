import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { extractJSON } from '@/lib/extract-json';

const client = new Anthropic();

interface MemoryCandidate {
  id: string;
  content: string;
  significance: number;
}

export async function POST(request: Request) {
  try {
    const { query, candidates } = (await request.json()) as {
      query: string;
      candidates: MemoryCandidate[];
    };

    if (candidates.length === 0) {
      return NextResponse.json({ ranked: [] });
    }

    const memoriesList = candidates
      .map((m, i) => `[${i}] "${m.content}"`)
      .join('\n');

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: `You are a memory relevance scoring system. Given a query and a list of memories, score each memory's relevance from 0.0 to 1.0.
Consider semantic similarity, emotional connection, and contextual relevance — not just keyword overlap.
"My cat died" is highly relevant to "I love Whiskers" even though they share no words.
Return ONLY valid JSON: {"scores": [0.8, 0.2, 0.9, ...]} matching the order of memories provided.`,
      messages: [
        {
          role: 'user',
          content: `Query: "${query}"\n\nMemories:\n${memoriesList}`,
        },
      ],
    });

    const responseText = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    const { scores } = JSON.parse(extractJSON(responseText)) as { scores: number[] };

    const ranked = candidates
      .map((m, i) => ({ ...m, relevance: scores[i] ?? 0 }))
      .sort((a, b) => b.relevance - a.relevance)
      .filter(m => m.relevance > 0.2);

    return NextResponse.json({ ranked });
  } catch (error) {
    console.error('Recall API error:', error);
    return NextResponse.json(
      { error: 'Failed to recall', details: String(error) },
      { status: 500 }
    );
  }
}
