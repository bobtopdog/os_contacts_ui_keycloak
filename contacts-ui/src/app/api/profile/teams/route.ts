import { NextRequest, NextResponse } from 'next/server';
import { getAllTeams, getUserTeams, addUserTeam } from '@/libs/teamsRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * GET /api/profile/teams?username=xxx
 * Returns all available teams + the user's current team memberships.
 */
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username');

  if (!username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username query parameter is required.' },
      { status: 400 }
    );
  }

  try {
    const [allTeams, userTeams] = await Promise.all([
      getAllTeams(),
      getUserTeams(username.trim()),
    ]);

    return NextResponse.json({ data: { allTeams, userTeams } });
  } catch (err) {
    console.error('GET /api/profile/teams error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/teams
 * Body: { username, teamId, isPrimary }
 */
export async function POST(request: NextRequest) {
  let body: { username?: string; teamId?: string; isPrimary?: boolean };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { username, teamId, isPrimary = false } = body;

  if (!username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username is required.' },
      { status: 400 }
    );
  }
  if (!teamId || !isValidUuid(teamId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'A valid teamId is required.' },
      { status: 400 }
    );
  }

  try {
    const userTeam = await addUserTeam(username.trim(), teamId, isPrimary);
    return NextResponse.json({ data: userTeam }, { status: 201 });
  } catch (err) {
    console.error('POST /api/profile/teams error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
