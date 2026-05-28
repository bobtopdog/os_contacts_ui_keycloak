import { NextRequest, NextResponse } from 'next/server';
import { updateLink, deleteLink } from '@/libs/linksRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * PATCH /api/links/link/:linkId
 * Body: { username, reference, label? }
 * Only succeeds if the link belongs to the given username.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params;

  if (!isValidUuid(linkId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: `"${linkId}" is not a valid link ID.` },
      { status: 400 }
    );
  }

  let body: { username?: string; reference?: string; label?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { username, reference, label = '' } = body;

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
    const link = await updateLink(linkId, username.trim(), reference.trim(), label.trim());

    if (!link) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Link not found or you are not the author.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: link });
  } catch (err) {
    console.error(`PATCH /api/links/link/${linkId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/links/link/:linkId
 * Body: { username }
 * Only succeeds if the link belongs to the given username.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params;

  if (!isValidUuid(linkId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: `"${linkId}" is not a valid link ID.` },
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
    const deleted = await deleteLink(linkId, username.trim());

    if (!deleted) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Link not found or you are not the author.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(`DELETE /api/links/link/${linkId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
