import { NextRequest, NextResponse } from 'next/server';
import { removeContactTag } from '@/libs/communitiesRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * DELETE /api/communities/tags/:tagId
 * Body: { username }
 * Only the user who tagged can remove their tag.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tagId: string }> }
) {
  const { tagId } = await params;

  if (!isValidUuid(tagId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid tag ID.' },
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

  if (!body.username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username is required.' },
      { status: 400 }
    );
  }

  try {
    const removed = await removeContactTag(tagId, body.username.trim());
    if (!removed) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only remove tags you created.' },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE tag error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
