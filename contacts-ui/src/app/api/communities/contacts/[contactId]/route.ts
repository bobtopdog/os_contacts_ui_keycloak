import { isValidContactId } from '@/libs/contactId';
import { NextRequest, NextResponse } from 'next/server';
import { getContactTags, addContactTag } from '@/libs/communitiesRepository';

/**
 * GET /api/communities/contacts/:contactId
 * Returns all community tags for a contact.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const { contactId } = await params;

  if (!isValidContactId(contactId)) {
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
