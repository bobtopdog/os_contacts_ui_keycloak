import { NextRequest, NextResponse } from 'next/server';
import { removeCommunityMember } from '@/libs/communitiesRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * DELETE /api/communities/:communityId/members/:memberId
 * Body: { username }
 * Only the community creator can remove members. Cannot remove themselves.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string; memberId: string }> }
) {
  const { communityId, memberId } = await params;

  if (!isValidUuid(communityId) || !isValidUuid(memberId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid IDs.' },
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
    const removed = await removeCommunityMember(communityId, memberId, body.username.trim());
    if (!removed) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only the creator can remove members, and creators cannot remove themselves.',
        },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE member error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
