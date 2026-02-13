import { NextResponse } from 'next/server';
import { perceive, type PerceiveParams } from '@/lib/claude';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PerceiveParams;

    const result = await perceive(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Perceive API error:', error);
    return NextResponse.json(
      { error: 'Failed to perceive', details: String(error) },
      { status: 500 }
    );
  }
}
