import { NextRequest, NextResponse } from 'next/server';
import { createDocument } from '@/libs/documentsRepository';
import { parseOutcome, isOutcomeFkError } from '@/libs/outcomeValidation';
import {
  MAX_FILE_SIZE_BYTES,
  isAllowedMimeType,
  isAllowedExtension,
  isValidCategory,
  DOCUMENT_CATEGORIES,
} from '@/libs/documentConfig';

// Disable Next.js default 4MB body limit so we can handle up to 2MB ourselves
export const config = {
  api: { bodyParser: false },
};

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * POST /api/documents
 * Multipart form data: contactId, username, category, file
 */
export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid form data' },
      { status: 400 }
    );
  }

  const contactId = formData.get('contactId') as string;
  const username = formData.get('username') as string;
  const category = formData.get('category') as string;
  const file = formData.get('file') as File | null;
  const outcomeId = formData.get('outcomeId') as string | null;
  const subOutcomeId = formData.get('subOutcomeId') as string | null;

  if (!contactId || !isValidUuid(contactId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'A valid contactId is required.' },
      { status: 400 }
    );
  }
  if (!username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username is required.' },
      { status: 400 }
    );
  }
  // Category is REQUIRED and must be one of the fixed values
  if (!category || !isValidCategory(category)) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: `A valid category is required. Accepted: ${DOCUMENT_CATEGORIES.join(', ')}.`,
      },
      { status: 400 }
    );
  }
  if (!file) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'No file provided.' },
      { status: 400 }
    );
  }

  // File size check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'Bad Request', message: `File exceeds the 2MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB).` },
      { status: 400 }
    );
  }

  // File type check — by MIME type and extension
  if (!isAllowedMimeType(file.type) && !isAllowedExtension(file.name)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'File type not allowed. Accepted: PDF, Word, Excel, MSG, EML.' },
      { status: 400 }
    );
  }
const parsed = parseOutcome(outcomeId, subOutcomeId);
    if ('error' in parsed) {
      return NextResponse.json({ error: 'Bad Request', message: parsed.error }, { status: 400 });
    }
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const document = await createDocument(
      contactId,
      username.trim(),
      file.name,
      file.type || 'application/octet-stream',
      file.size,
      category,
      buffer,
      parsed.outcomeId,
      parsed.subOutcomeId
    );

    return NextResponse.json({ data: document }, { status: 201 });
  } catch (err) {
    if (isOutcomeFkError(err)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'That sub-outcome does not belong to the chosen outcome.' },
        { status: 400 }
      );
    }
    console.error('POST /api/documents error:', err);

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
