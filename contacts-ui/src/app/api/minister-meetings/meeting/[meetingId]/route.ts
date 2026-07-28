import { NextRequest, NextResponse } from 'next/server';
import { updateMinisterMeeting, deleteMinisterMeeting } from '@/libs/ministerMeetingsRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * PATCH /api/minister-meetings/meeting/:meetingId
 * Body: { username, meetingDate, title, comments }
 * Only the author can update their own meeting.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { meetingId } = await params;

  if (!isValidUuid(meetingId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid meeting ID.' },
      { status: 400 }
    );
  }

  let body: { username?: string; meetingDate?: string; title?: string; comments?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { username, meetingDate, title, comments = '' } = body;

  if (!username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username is required.' },
      { status: 400 }
    );
  }
  if (!meetingDate) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'meetingDate is required.' },
      { status: 400 }
    );
  }
  if (!title?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'title is required.' },
      { status: 400 }
    );
  }

  try {
    const meeting = await updateMinisterMeeting(
      meetingId,
      username.trim(),
      meetingDate,
      title.trim(),
      comments.trim()
    );

    if (!meeting) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Meeting not found or you are not the author.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: meeting });
  } catch (err) {
    console.error(`PATCH /api/minister-meetings/meeting/${meetingId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/minister-meetings/meeting/:meetingId
 * Body: { username }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { meetingId } = await params;

  if (!isValidUuid(meetingId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid meeting ID.' },
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
    const deleted = await deleteMinisterMeeting(meetingId, body.username.trim());
    if (!deleted) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Meeting not found or you are not the author.' },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`DELETE /api/minister-meetings/meeting/${meetingId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
