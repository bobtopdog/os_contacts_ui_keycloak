import { NextRequest, NextResponse } from 'next/server';
import { createPoc } from '@/libs/pocRepository';

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
 *   "details":   "Called to discuss renewal."
 * }
 */
export async function POST(request: NextRequest) {
  let body: { contactId?: string; username?: string; details?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { contactId, username, details } = body;

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
  if (!details?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Contact details must not be empty.' },
      { status: 400 }
    );
  }

  try {
    const poc = await createPoc(contactId, username.trim(), details.trim());
    return NextResponse.json({ data: poc }, { status: 201 });
  } catch (err) {
    console.error('POST /api/poc error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
