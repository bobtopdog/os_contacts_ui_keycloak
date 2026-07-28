import { NextRequest, NextResponse } from 'next/server';
import { duplicateMeetingGroup } from '@/libs/meetingGroupsRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * POST /api/meeting-groups/:groupId/duplicate
 * Body: { username }
 * Duplicates the group and all members. The requester (any member of the
 * source group) becomes creator + admin of the copy.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;

  if (!isValidUuid(groupId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid group ID.' },
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
    const copy = await duplicateMeetingGroup(groupId, body.username.trim());
    if (!copy) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You must be a member of the group to duplicate it.' },
        { status: 403 }
      );
    }
    return NextResponse.json({ data: copy }, { status: 201 });
  } catch (err) {
    console.error(`POST /api/meeting-groups/${groupId}/duplicate error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
