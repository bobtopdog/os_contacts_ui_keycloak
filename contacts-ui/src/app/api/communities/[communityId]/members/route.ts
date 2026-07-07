import { NextRequest, NextResponse } from 'next/server';
import { addCommunityMember } from '@/libs/communitiesRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * POST /api/communities/:communityId/members
 * Body: { requestingUser, newMemberUsername }
 * Only the community creator can add members.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  const { communityId } = await params;

  if (!isValidUuid(communityId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid community ID.' },
      { status: 400 }
    );
  }

  let body: { requestingUser?: string; newMemberUsername?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { requestingUser, newMemberUsername } = body;

  if (!requestingUser?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'requestingUser is required.' },
      { status: 400 }
    );
  }
  if (!newMemberUsername?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'newMemberUsername is required.' },
      { status: 400 }
    );
  }

  try {
    const member = await addCommunityMember(
      communityId,
      requestingUser.trim(),
      newMemberUsername.trim()
    );

    if (!member) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only the creator can add members, or the user is already a member.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: member }, { status: 201 });
  } catch (err) {
    console.error('POST member error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
