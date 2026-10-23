import { isValidContactId } from '@/libs/contactId';
import { NextRequest, NextResponse } from 'next/server';
import { getPocByContactId } from '@/libs/pocRepository';

/**
 * GET /api/poc/:contactId
 * Returns all poc for a given contact from the poc database, newest first.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const { contactId } = await params;
  if (!isValidContactId(contactId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid contact ID.' }, { status: 400 });
  }

  try {
    const poc = await getPocByContactId(contactId);
    return NextResponse.json({ data: poc });
  } catch (err) {
    console.error(`GET /api/poc/${contactId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }

 
}
