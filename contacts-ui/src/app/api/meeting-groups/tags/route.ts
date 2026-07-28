import { NextRequest, NextResponse } from 'next/server';
import {
  tagMeeting, getGroupMemberUsernames, getGroupName,
} from '@/libs/meetingGroupsRepository';
import { meetingTaggedNotification } from '@/libs/email';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * POST /api/meeting-groups/tags
 * Body: { meetingId, groupId, taggedBy }
 * Tags a contact meeting with a group. Requirement 5: all members of the
 * group are notified by email.
 */
export async function POST(request: NextRequest) {
  let body: { meetingId?: string; groupId?: string; taggedBy?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { meetingId, groupId, taggedBy } = body;

  if (!meetingId || !isValidUuid(meetingId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'A valid meetingId is required.' },
      { status: 400 }
    );
  }
  if (!groupId || !isValidUuid(groupId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'A valid groupId is required.' },
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
    const tag = await tagMeeting(meetingId, groupId, taggedBy.trim());

    if (!tag) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You must be a member of the group to tag a meeting.' },
        { status: 403 }
      );
    }

    // Requirement 5: notify ALL group members by email (fire-and-forget)
    Promise.all([getGroupMemberUsernames(groupId), getGroupName(groupId)])
      .then(([members, name]) =>
        meetingTaggedNotification(members, name, taggedBy.trim(), meetingId)
      ).catch(console.error);

    return NextResponse.json({ data: tag }, { status: 201 });
  } catch (err) {
    console.error('POST meeting tag error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
