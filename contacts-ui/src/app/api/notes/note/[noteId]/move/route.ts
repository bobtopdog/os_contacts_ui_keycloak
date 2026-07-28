import { NextRequest, NextResponse } from 'next/server';
import { moveNote } from '@/libs/notesRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * POST /api/notes/note/:noteId/move
 * Body: { username }
 * Moves the note from contact_notes to contact_anex_notes.
 * Only the note owner can move it.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const { noteId } = await params;

  if (!isValidUuid(noteId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid note ID.' },
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
    const moved = await moveNote(noteId, body.username.trim());
    if (!moved) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Note not found or you are not the owner.' },
        { status: 403 }
      );
    }
    return NextResponse.json({ data: moved });
  } catch (err) {
    console.error(`POST /api/notes/note/${noteId}/move error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
