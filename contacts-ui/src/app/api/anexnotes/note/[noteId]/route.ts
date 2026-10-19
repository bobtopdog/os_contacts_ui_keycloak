import { NextRequest, NextResponse } from 'next/server';
import { updateNote, deleteNote } from '@/libs/anexNotesRepository';
import { parseOutcome, isOutcomeFkError } from '@/libs/outcomeValidation';
function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * PATCH /api/anexnotes/note/:noteId
 *
 * Body: { username: string, comment: string }
 * Only succeeds if the note belongs to the given username.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const { noteId } = await params;

  if (!isValidUuid(noteId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: `"${noteId}" is not a valid note ID.` },
      { status: 400 }
    );
  }

  let body: { username?: string; comment?: string; outcomeId?: number | null; subOutcomeId?: number | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { username, comment, outcomeId, subOutcomeId } = body;

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
    const note = await updateNote(noteId, username.trim(), comment.trim(), parsed.outcomeId, parsed.subOutcomeId);

    if (!note) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Note not found or you are not the author.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: note });
  } catch (err) {
    if (isOutcomeFkError(err)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'That sub-outcome does not belong to the chosen outcome.' },
        { status: 400 }
      );
    }
    console.error(`PATCH /api/anexnotes/note/${noteId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/anexnotes/note/:noteId
 *
 * Body: { username: string }
 * Only succeeds if the note belongs to the given username.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const { noteId } = await params;

  if (!isValidUuid(noteId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: `"${noteId}" is not a valid note ID.` },
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

  const { username } = body;

  if (!username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username is required.' },
      { status: 400 }
    );
  }

  try {
    const deleted = await deleteNote(noteId, username.trim());

    if (!deleted) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Note not found or you are not the author.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(`DELETE /api/anexnotes/note/${noteId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
