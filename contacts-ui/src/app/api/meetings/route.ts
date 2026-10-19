import { NextRequest, NextResponse } from 'next/server'; 
import { createMeeting } from '@/libs/meetingsRepository';
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
 * POST /api/meetings 
 * Body: { contactId, username, meetingDate, title, notes, score1, score2, score3, score4, outcomeId, subOutcomeId  } 
 */ 

export async function POST(request: NextRequest) { 
  let body: Record<string, unknown>; 

  try { 
    body = await request.json(); 
  } catch { 
    return NextResponse.json( 
      { error: 'Bad Request', message: 'Invalid JSON body' }, 
      { status: 400 } 
    ); 
  } 
  const { contactId, username, meetingDate, title, notes, score1, score2, score3, score4, outcomeId, subOutcomeId } = body;

  if (!contactId || !isValidUuid(String(contactId))) { 

    return NextResponse.json( 
      { error: 'Bad Request', message: 'A valid contactId is required.' }, 
      { status: 400 } 
    ); 
  } 

  if (!username || String(username).trim() === '') { 
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
if (!title) { 
    return NextResponse.json( 
      { error: 'Bad Request', message: 'title is required.' }, 
      { status: 400 } 
    ); 
  } 
  const parsed = parseOutcome(outcomeId, subOutcomeId);
  if ('error' in parsed) {
    return NextResponse.json({ error: 'Bad Request', message: parsed.error }, { status: 400 });
  }
  const assessment = parseAssessment(body.assessment);
  if ('error' in assessment) {
    return NextResponse.json({ error: 'Bad Request', message: assessment.error }, { status: 400 });
  }

  try { 
    const meeting = await createMeeting( 
      String(contactId), 
      String(username).trim(), 
      String(meetingDate), 
      String(title).trim(),
      String(notes ?? '').trim(), 
      clampScore(score1), 
      clampScore(score2), 
      clampScore(score3), 
      clampScore(score4),
      parsed.outcomeId,
      parsed.subOutcomeId,
      assessment
    ); 

    return NextResponse.json({ data: meeting }, { status: 201 }); 

  } catch (err) { 
    if (isOutcomeFkError(err)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'That sub-outcome does not belong to the chosen outcome.' },
        { status: 400 }
      );
    }
    console.error('POST /api/meetings error:', err); 
    return NextResponse.json( 
      { error: 'Internal Server Error', message: 'An unexpected error occurred' }, 
      { status: 500 } 
    ); 

  } 

} 