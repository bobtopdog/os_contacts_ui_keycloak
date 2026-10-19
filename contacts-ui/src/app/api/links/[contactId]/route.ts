import { NextRequest, NextResponse } from 'next/server';
import { getLinksByContactId } from '@/libs/linksRepository';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


/** GET /api/links/:contactId — all links for a contact, with outcome ids */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const { contactId } = await params;
  if (!UUID.test(contactId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid contact ID.' }, { status: 400 });
  }

  try {
    return NextResponse.json({ data: await getLinksByContactId(contactId) });
  } catch (err) {
    console.error(`GET /api/links/${contactId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 });
  }
}
