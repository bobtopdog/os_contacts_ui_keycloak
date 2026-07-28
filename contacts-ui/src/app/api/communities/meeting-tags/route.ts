import { NextRequest, NextResponse } from 'next/server';
import { tagMeetingWithCommunity } from '@/libs/communitiesRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * POST /api/communities/meeting-tags
 * Body: { meetingId, communityId, taggedBy }
 * Tags a contact meeting with a community. User must be a community member.
 * No email notifications for community tags (unlike meeting groups).
 */
export async function POST(request: NextRequest) {
  let body: { meetingId?: string; communityId?: string; taggedBy?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { meetingId, communityId, taggedBy } = body;

  if (!meetingId || !isValidUuid(meetingId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'A valid meetingId is required.' },
      { status: 400 }
    );
  }
  if (!communityId || !isValidUuid(communityId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'A valid communityId is required.' },
      { status: 400 }
    );
  }
  if (!taggedBy?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'taggedBy is required.' },
      { status: 400 }
    );
  }

  try {
    const tag = await tagMeetingWithCommunity(meetingId, communityId, taggedBy.trim());
    if (!tag) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You must be a member of the community, or this meeting is already tagged with it.',
        },
        { status: 403 }
      );
    }
    return NextResponse.json({ data: tag }, { status: 201 });
  } catch (err) {
    console.error('POST community meeting tag error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
