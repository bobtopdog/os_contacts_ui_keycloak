import { NextResponse } from 'next/server';
import { getOutcomeTree } from '@/libs/outcomeRepository';

/** GET /api/lookups/outcomes — the full outcome → sub-outcome tree */
export async function GET() {
  try {
    return NextResponse.json({ data: await getOutcomeTree() });
  } catch (err) {
    console.error('GET /api/lookups/outcomes error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
