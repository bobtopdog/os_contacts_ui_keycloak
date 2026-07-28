import { NextRequest, NextResponse } from 'next/server';
import { getMeetingCommunityTags, removeMeetingCommunityTag } from '@/libs/communitiesRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * GET /api/communities/meeting-tags/:meetingId
 * Returns all community tags for a contact meeting.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { meetingId } = await params;

  if (!isValidUuid(meetingId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid meeting ID.' },
      { status: 400 }
    );
  }

  try {
    const tags = await getMeetingCommunityTags(meetingId);
    return NextResponse.json({ data: tags });
  } catch (err) {
    console.error('GET meeting community tags error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/communities/meeting-tags/:meetingId
 * Body: { tagId, username }
 * Removes a community tag from a meeting — only the tagger can remove it.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  await params; // tagId in the body identifies the row

  let body: { tagId?: string; username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { tagId, username } = body;

  if (!tagId || !isValidUuid(tagId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'A valid tagId is required.' },
      { status: 400 }
    );
  }
  if (!username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username is required.' },
      { status: 400 }
    );
  }

  try {
    const removed = await removeMeetingCommunityTag(tagId, username.trim());
    if (!removed) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only remove tags you created.' },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE meeting community tag error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
