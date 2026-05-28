import { NextRequest, NextResponse } from 'next/server';
import { removeUserTeam } from '@/libs/teamsRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * DELETE /api/profile/teams/:userTeamId
 * Body: { username }
 * Removes the user from the team — only the user themselves can do this.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId: userTeamId } = await params;

  if (!isValidUuid(userTeamId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: `"${userTeamId}" is not a valid ID.` },
      { status: 400 }
    );
  }

  let body: { username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  if (!body.username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username is required.' },
      { status: 400 }
    );
  }

  try {
    const removed = await removeUserTeam(userTeamId, body.username.trim());

    if (!removed) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Team membership not found or you are not the owner.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`DELETE /api/profile/teams/${userTeamId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
