import { NextResponse } from 'next/server';
import { getAllAreas } from '@/libs/areasDdRepository';

/**
 * GET /api/teams
 * Returns all teams for the team buttons on the home page.
 */
export async function GET() {
  try {
    const tags = await getAllAreas();
    return NextResponse.json({ data: tags });
  } catch (err) {
    console.error('GET /api/areas error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}