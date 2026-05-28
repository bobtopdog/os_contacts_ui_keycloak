import { NextRequest, NextResponse } from 'next/server';
import { createArea } from '@/libs/areasRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * POST /api/notes
 *
 * Body (JSON):
 * {
 *   "contactId": "uuid",
 *   "username":  "john.doe",
 *   "tag":   "Business."
 * }
 */
export async function POST(request: NextRequest) {
  let body: { contactId?: string; username?: string; area?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { contactId, username, area } = body;

  if (!contactId || !isValidUuid(contactId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'A valid contactId (UUID) is required.' },
      { status: 400 }
    );
  }
  if (!username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username is required.' },
      { status: 400 }
    );
  }
  if (!area?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'areas must not be empty.' },
      { status: 400 }
    );
  }

  try {
    const areas = await createArea(contactId, username.trim(), area.trim());
    return NextResponse.json({ data: areas }, { status: 201 });
  } catch (err) {
    console.error('POST /api/area error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
