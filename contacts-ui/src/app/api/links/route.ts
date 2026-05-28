import { NextRequest, NextResponse } from 'next/server';
import { createLink } from '@/libs/linksRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * POST /api/links
 * Body (JSON):
 * {
 *   "contactId": "uuid",
 *   "username":  "john.doe",
 *   "reference":   "C"'
 *   "label?": ""
 * 
 * }
 */
export async function POST(request: NextRequest) {
  let body: { contactId?: string; username?: string; reference?: string; label?: string  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { contactId, username, reference, label } = body;

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
  if (!reference?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Document reference must not be empty.' },
      { status: 400 }
    );
  
  }
if (!label?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Document label must not be empty.' },
      { status: 400 }
    );
  
  }
  try {
    const link = await createLink(contactId, username.trim(), reference.trim(), label.trim());
    return NextResponse.json({ data: link }, { status: 201 });
  } catch (err) {
    console.error('POST /api/links error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
