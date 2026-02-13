import { NextResponse } from 'next/server';
import { think, type ThinkParams } from '@/lib/claude';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ThinkParams;

    const result = await think(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Think API error:', error);
    return NextResponse.json(
      { error: 'Failed to think', details: String(error) },
      { status: 500 }
    );
  }
}
