import { NextRequest, NextResponse } from 'next/server';
import { getLiveProfile, LiveAuthError } from '@/libs/liveContactsServer';
import { isValidContactId } from '@/libs/contactId';

/** GET /api/contacts/:id — one profile, mapped to the app's ContactDetail. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = decodeURIComponent((await params).id);
  if (!isValidContactId(id)) {
    return NextResponse.json({ error: 'Bad Request', message: 'Invalid contact id.' }, { status: 400 });
  }

  try {
    const contact = await getLiveProfile(id);
    if (!contact) {
      return NextResponse.json({ error: 'Not Found', message: 'Contact not found.' }, { status: 404 });
    }
    return NextResponse.json({ data: contact });
  } catch (err) {
    if (err instanceof LiveAuthError) {
      return NextResponse.json({ error: 'Unauthorized', message: err.message }, { status: 401 });
    }
    console.error(`GET /api/contacts/${id} error:`, err);
    return NextResponse.json(
      { error: 'Bad Gateway', message: 'The contacts service could not be reached.' }, { status: 502 });
  }
}
