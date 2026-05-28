import { NextRequest, NextResponse } from 'next/server';
import { getAreaByContactId } from '@/libs/areasRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * GET /api/notes/:contactId
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
    const areas = await getAreaByContactId(contactId);
    return NextResponse.json({ data: areas});
  } catch (err) {
    console.error(`GET /api/area/${contactId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
