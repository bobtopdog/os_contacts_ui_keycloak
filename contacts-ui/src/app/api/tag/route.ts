import { NextRequest, NextResponse } from 'next/server';
import { createTag } from '@/libs/tagsRepository';

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
  let body: { contactId?: string; username?: string; tag?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { contactId, username, tag } = body;

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
  if (!tag?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'tags must not be empty.' },
      { status: 400 }
    );
  }

  try {
    const tags = await createTag(contactId, username.trim(), tag.trim());
    return NextResponse.json({ data: tags }, { status: 201 });
  } catch (err) {
    console.error('POST /api/tag error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
