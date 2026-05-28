import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById } from '@/libs/documentsRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * GET /api/documents/download/:documentId
 * Streams the file binary to the browser as a download.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;

  if (!isValidUuid(documentId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: `"${documentId}" is not a valid document ID.` },
      { status: 400 }
    );
  }

  try {
    const result = await getDocumentById(documentId);

    if (!result) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Document not found.' },
        { status: 404 }
      );
    }

    const { meta, data } = result;

    // Return the file as a download
    
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': meta.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(meta.filename)}"`,
        'Content-Length': String(meta.fileSize),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error(`GET /api/documents/download/${documentId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
