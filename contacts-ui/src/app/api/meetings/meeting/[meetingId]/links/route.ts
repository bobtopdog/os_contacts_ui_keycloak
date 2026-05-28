import { NextRequest, NextResponse } from 'next/server';
import { addMeetingLink, deleteMeetingLink } from '@/libs/meetingsRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * POST /api/meetings/meeting/:meetingId/links
 * Body: { reference }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { meetingId } = await params;

  if (!isValidUuid(meetingId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: `"${meetingId}" is not a valid meeting ID.` },
      { status: 400 }
    );
  }

  let body: { reference?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Bad Request', message: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.reference?.trim()) {
    return NextResponse.json({ error: 'Bad Request', message: 'reference is required.' }, { status: 400 });
  }

  try {
    const link = await addMeetingLink(meetingId, body.reference.trim());
    return NextResponse.json({ data: link }, { status: 201 });
  } catch (err) {
    console.error(`POST /api/meetings/meeting/${meetingId}/links error:`, err);
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}

/**
 * DELETE /api/meetings/meeting/:meetingId/links
 * Body: { meetingLinkId }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { meetingId: _meetingId } = await params;

  let body: { meetingLinkId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Bad Request', message: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.meetingLinkId || !isValidUuid(body.meetingLinkId)) {
    return NextResponse.json({ error: 'Bad Request', message: 'A valid meetingLinkId is required.' }, { status: 400 });
  }

  try {
    const deleted = await deleteMeetingLink(body.meetingLinkId);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Meeting link not found.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE meeting link error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}
