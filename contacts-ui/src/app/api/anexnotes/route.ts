import { isValidContactId } from '@/libs/contactId';
import { NextRequest, NextResponse } from 'next/server';
import { createNote } from '@/libs/anexNotesRepository';
import { parseOutcome, isOutcomeFkError } from '@/libs/outcomeValidation';

/**
 * POST /api/notes
 *
 * Body (JSON):
 * {
 *   "contactId": "smithD_10",
 *   "username":  "john.doe",
 *   "comment":   "Called to discuss renewal."
 * }
 */
export async function POST(request: NextRequest) {
  let body: { contactId?: string; username?: string; comment?: string; outcomeId?: number | null ; subOutcomeId?: number | null };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { contactId, username, comment, outcomeId, subOutcomeId } = body;

  if (!contactId || !isValidContactId(contactId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'A valid contactId is required.' },
      { status: 400 }
    );
  }
  if (!username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username is required.' },
      { status: 400 }
    );
  }
  if (!comment?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'comment must not be empty.' },
      { status: 400 }
    );
  }
const parsed = parseOutcome(body.outcomeId, body.subOutcomeId);
    if ('error' in parsed) {
      return NextResponse.json({ error: 'Bad Request', message: parsed.error }, { status: 400 });
    }

  try {
    const note = await createNote(contactId, username.trim(), comment.trim(), parsed.outcomeId, parsed.subOutcomeId);
    return NextResponse.json({ data: note }, { status: 201 });
  } catch (err) {
    console.error('POST /api/anexnotes error:', err);
     
    if (isOutcomeFkError(err)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'That sub-outcome does not belong to the chosen outcome.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
