import { NextRequest, NextResponse } from 'next/server';
import { createLink } from '@/libs/linksRepository';
import { parseOutcome, isOutcomeFkError } from '@/libs/outcomeValidation';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/links
 * Body: { contactId, username, reference, label, outcomeId?, subOutcomeId? }
 */
export async function POST(request: NextRequest) {
  let body: {
    contactId?: string; username?: string; reference?: string; label?: string; outcomeId?: number | null ; subOutcomeId?: number | null ;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' }, { status: 400 });
  }

  const contactId = body.contactId ?? '';
  const username = body.username?.trim() ?? '';
  const reference = body.reference?.trim() ?? '';
  const label = body.label?.trim() ?? '';

  if (!UUID.test(contactId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'A valid contactId is required.' }, { status: 400 });
  }
  if (!username || !reference) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username and reference are required.' }, { status: 400 });
  }

  const outcome = parseOutcome(body.outcomeId, body.subOutcomeId);
  if ('error' in outcome) {
    return NextResponse.json(
      { error: 'Bad Request', message: outcome.error }, { status: 400 });
  }

  try {
    const link = await createLink(
      contactId, username, reference, label,
      outcome.outcomeId, outcome.subOutcomeId
    );
    return NextResponse.json({ data: link }, { status: 201 });
  } catch (err) {
    if (isOutcomeFkError(err)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'That sub-outcome does not belong to the chosen outcome.' },
        { status: 400 });
    }
    console.error('POST /api/links error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 });
  }
}
