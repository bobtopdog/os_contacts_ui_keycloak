import { NextRequest, NextResponse } from 'next/server';
import { updateMeeting, deleteMeeting } from '@/libs/meetingsRepository';
import { parseOutcome, isOutcomeFkError } from '@/libs/outcomeValidation';
import { parseAssessment } from '@/libs/meetingAssessmentConfig';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function clampScore(value: unknown): number {
  const n = parseInt(String(value), 10);
  return isNaN(n) ? 0 : Math.min(5, Math.max(0, n));
}

/**
 * PATCH /api/meetings/meeting/:meetingId
 * Body: { username, meetingDate, title, notes, score1, score2, score3, score4 }
 */
export async function PATCH(
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Bad Request', message: 'Invalid JSON body' }, { status: 400 });
  }

  const { username, meetingDate, title, notes, score1, score2, score3, score4, outcomeId, subOutcomeId  } = body;

  if (!username || String(username).trim() === '') {
    return NextResponse.json({ error: 'Bad Request', message: 'username is required.' }, { status: 400 });
  }
  if (!meetingDate) {
    return NextResponse.json({ error: 'Bad Request', message: 'meetingDate is required.' }, { status: 400 });
  }
const parsed = parseOutcome(body.outcomeId, body.subOutcomeId);
    if ('error' in parsed) {
      return NextResponse.json({ error: 'Bad Request', message: parsed.error }, { status: 400 });
    }
  const assessment = parseAssessment(body.assessment);
  if ('error' in assessment) {
    return NextResponse.json({ error: 'Bad Request', message: assessment.error }, { status: 400 });
  }
  try {
    const meeting = await updateMeeting(
      meetingId,
      String(username).trim(),
      String(meetingDate),
      String(title ?? '').trim(),
      String(notes ?? '').trim(),
      clampScore(score1),
      clampScore(score2),
      clampScore(score3),
      clampScore(score4),
      parsed.outcomeId,
      parsed.subOutcomeId,
      assessment
    );

    if (!meeting) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Meeting not found or you are not the author.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: meeting });
  } catch (err) {
    console.error(`PATCH /api/meetings/meeting/${meetingId} error:`, err);
    if (isOutcomeFkError(err)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'That sub-outcome does not belong to the chosen outcome.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}

/**
 * DELETE /api/meetings/meeting/:meetingId
 * Body: { username }
 */
export async function DELETE(
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

  let body: { username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Bad Request', message: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.username?.trim()) {
    return NextResponse.json({ error: 'Bad Request', message: 'username is required.' }, { status: 400 });
  }

  try {
    const deleted = await deleteMeeting(meetingId, body.username.trim());
    if (!deleted) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Meeting not found or you are not the author.' },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`DELETE /api/meetings/meeting/${meetingId} error:`, err);
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}
