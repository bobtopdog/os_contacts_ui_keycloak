import { NextRequest, NextResponse } from 'next/server';
import { getMeetingsByUserName} from '@/libs/meetingsRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * GET /api/notes/:contactId
 * Returns all notes for a given contact from the notes database, newest first.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userName: string }> }
) {
  const { userName } = await params;

  try {
    const notes = await getMeetingsByUserName(userName);
    return NextResponse.json({ data: notes });
  } catch (err) {
    console.error(`GET /api/meetings/mymeetings/${userName} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
