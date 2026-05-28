import { NextRequest, NextResponse } from 'next/server';
import { getNotesByContactId } from '@/libs/anexNotesRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * GET /api/anexnotes/:contactId
 * Returns all notes for a given contact from the notes database, newest first.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const { contactId } = await params;

  if (!isValidUuid(contactId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: `"${contactId}" is not a valid contact ID.` },
      { status: 400 }
    );
  }

  try {
    const notes = await getNotesByContactId(contactId);
    return NextResponse.json({ data: notes });
  } catch (err) {
    console.error(`GET /api/anexnotes/${contactId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
