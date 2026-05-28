import { NextRequest, NextResponse } from 'next/server';
import { deleteTag, } from '@/libs/tagsRepository';

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
  { params }: { params: Promise<{ tagId: string }> }
) {
  const { tagId } = await params;

  if (!isValidUuid(tagId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: `"${tagId}" is not a valid tag ID.` },
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
    const deleted = await deleteTag(tagId, username.trim());

    if (!deleted) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Tag not found or you are not the author.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(`DELETE /api/tag/ptag/${tagId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}



