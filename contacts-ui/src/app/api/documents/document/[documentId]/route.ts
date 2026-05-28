import { NextRequest, NextResponse } from 'next/server';
import { deleteDocument } from '@/libs/documentsRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * DELETE /api/documents/document/:documentId
 * Body: { username }
 * Only succeeds if the document belongs to the given username.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;

  if (!isValidUuid(documentId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: `"${documentId}" is not a valid document ID.` },
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
    const deleted = await deleteDocument(documentId, body.username.trim());

    if (!deleted) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Document not found or you are not the owner.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`DELETE /api/documents/document/${documentId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
