import { NextRequest, NextResponse } from 'next/server';
import { getNotesByMemberId } from '@/libs/ministers/notesRepository';


/**
 * GET /api/notes/:contactId
 * Returns all notes for a given contact from the notes database, newest first.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
const id = Number(memberId);
  try {
    const notes = await getNotesByMemberId(id);
    return NextResponse.json({ data: notes });
  } catch (err) {
    console.error(`GET /api/ministernotes/${memberId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
