import { NextRequest, NextResponse } from 'next/server';
import { updateNote, deleteNote } from '@/libs/highlightNotesRepository';

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

  let body: { username?: string; comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { username, comment } = body;

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

  try {
    const note = await updateNote(noteId, username.trim(), comment.trim());

    if (!note) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Note not found or you are not the author.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: note });
  } catch (err) {
    console.error(`PATCH /api/highlightnotes/note/${noteId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notes/note/:noteId
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
    console.error(`DELETE /api/highlightnotes/note/${noteId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
