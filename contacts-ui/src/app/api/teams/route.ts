import { NextResponse } from 'next/server';
import { getAllTeams } from '@/libs/teamsRepository';

/**
 * GET /api/teams
 * Returns all teams for the team buttons on the home page.
 */
export async function GET() {
  try {
    const teams = await getAllTeams();
    return NextResponse.json({ data: teams });
  } catch (err) {
    console.error('GET /api/teams error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
