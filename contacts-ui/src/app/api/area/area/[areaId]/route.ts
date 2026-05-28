import { NextRequest, NextResponse } from 'next/server';
import { deleteArea, } from '@/libs/areasRepository';

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
  { params }: { params: Promise<{ areaId: string }> }
) {
  const { areaId } = await params;

  if (!isValidUuid(areaId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: `"${areaId}" is not a valid area ID.` },
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
    const deleted = await deleteArea(areaId, username.trim());

    if (!deleted) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Area not found or you are not the author.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(`DELETE /api/area/area/${areaId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}



