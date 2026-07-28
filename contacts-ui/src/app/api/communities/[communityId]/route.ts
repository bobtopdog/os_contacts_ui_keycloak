import { NextRequest, NextResponse } from 'next/server';
import { getCommunityMembers, deleteCommunity } from '@/libs/communitiesRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * GET /api/communities/:communityId
 * Returns the community's members.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  const { communityId } = await params;

  if (!isValidUuid(communityId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid community ID.' },
      { status: 400 }
    );
  }

  try {
    const members = await getCommunityMembers(communityId);
    return NextResponse.json({ data: members });
  } catch (err) {
    console.error('GET community members error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/communities/:communityId
 * Body: { username }
 * Only the creator can delete.
 */
export async function DELETE(
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
    const deleted = await deleteCommunity(communityId, body.username.trim());
    if (!deleted) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only the creator can delete this community.' },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE community error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
