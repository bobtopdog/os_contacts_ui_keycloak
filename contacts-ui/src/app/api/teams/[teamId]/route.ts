import { NextRequest, NextResponse } from 'next/server';
import { getTeamById, getTeamMembers, updateTeamDetails } from '@/libs/teamsRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * GET /api/teams/:teamId
 * Returns team details and member list.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;

  if (!isValidUuid(teamId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: `"${teamId}" is not a valid team ID.` },
      { status: 400 }
    );
  }

  try {
    const [team, members] = await Promise.all([
      getTeamById(teamId),
      getTeamMembers(teamId),
    ]);

    if (!team) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Team not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { team, members } });
  } catch (err) {
    console.error(`GET /api/teams/${teamId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/teams/:teamId
 * Body: { username, description, intranetUrl }
 * Only primary contacts of the team can update.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;

  if (!isValidUuid(teamId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: `"${teamId}" is not a valid team ID.` },
      { status: 400 }
    );
  }

  let body: { username?: string; description?: string; intranetUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { username, description = '', intranetUrl = '' } = body;

  if (!username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username is required.' },
      { status: 400 }
    );
  }

  // Verify the user is a primary contact for this team
  const members = await getTeamMembers(teamId);
  const isPrimaryContact = members.some(
    (m) => m.username === username.trim() && m.isPrimary
  );

  if (!isPrimaryContact) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Only primary contacts can edit team details.' },
      { status: 403 }
    );
  }

  try {
    const team = await updateTeamDetails(teamId, description.trim(), intranetUrl.trim());

    if (!team) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Team not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: team });
  } catch (err) {
    console.error(`PATCH /api/teams/${teamId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
