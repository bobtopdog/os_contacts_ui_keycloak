import { NextRequest, NextResponse } from 'next/server';
import { deletePoc, createPoc } from '@/libs/pocRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * DELETE /
 *
 * Body: { username: string }
 * Only succeeds if the note belongs to the given username.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pocId: string }> }
) {
  const { pocId } = await params;

  if (!isValidUuid(pocId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: `"${pocId}" is not a valid PoC ID.` },
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

  const { username } = body;

  if (!username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username is required.' },
      { status: 400 }
    );
  }

  try {
    const deleted = await deletePoc(pocId, username.trim());

    if (!deleted) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'PoC not found or you are not the author.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(`DELETE /api/poc/poc/${pocId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/poc
 *
 * Body (JSON):
 * {
 *   "contactId": "uuid",
 *   "username":  "john.doe",
 *   "comment":   "Called to discuss renewal."
 * }
 *
 * Returns 409 Conflict if the user has already posted a note for this contact.
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
      { error: 'Bad Request', message: 'comment must not be empty.' },
      { status: 400 }
    );
  }

  try {
    const note = await createPoc(contactId, username.trim(), details.trim());

    if (!note) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: 'You are already added as a PoC for this contact.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ data: note }, { status: 201 });
  } catch (err) {
    console.error('POST /api/poc error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

