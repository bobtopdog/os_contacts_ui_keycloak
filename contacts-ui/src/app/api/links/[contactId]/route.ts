import { NextRequest, NextResponse } from 'next/server';
import { getLinksByContactId, createLink } from '@/libs/linksRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * GET /api/links/:contactId
 * Returns all links for a given contact, newest first.
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
    const links = await getLinksByContactId(contactId);
    return NextResponse.json({ data: links });
  } catch (err) {
    console.error(`GET /api/links/${contactId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/links
 * Body: { contactId, username, reference, label? }
 */
export async function POST(request: NextRequest) {
  let body: { contactId?: string; username?: string; reference?: string; label?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { contactId, username, reference, label = '' } = body;

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
      { error: 'Bad Request', message: 'reference must not be empty.' },
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
