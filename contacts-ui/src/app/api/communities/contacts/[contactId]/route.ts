import { NextRequest, NextResponse } from 'next/server';
import { getContactTags, addContactTag } from '@/libs/communitiesRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * GET /api/communities/contacts/:contactId
 * Returns all community tags for a contact.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const { contactId } = await params;

  if (!isValidUuid(contactId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid contact ID.' },
      { status: 400 }
    );
  }

  try {
    const tags = await getContactTags(contactId);
    return NextResponse.json({ data: tags });
  } catch (err) {
    console.error('GET tags error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
