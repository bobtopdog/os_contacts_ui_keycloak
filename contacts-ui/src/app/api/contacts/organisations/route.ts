import { NextResponse } from 'next/server';
import { getLiveOrganisations, LiveAuthError } from '@/libs/liveContactsServer';

/** GET /api/contacts/organisations — [{ id, name }] for the dropdown. */
export async function GET() {
  try {
    return NextResponse.json({ data: await getLiveOrganisations() });
  } catch (err) {
    if (err instanceof LiveAuthError) {
      return NextResponse.json({ error: 'Unauthorized', message: err.message }, { status: 401 });
    }
    console.error('GET /api/contacts/organisations error:', err);
    return NextResponse.json(
      { error: 'Bad Gateway', message: 'The contacts service could not be reached.' }, { status: 502 });
  }
}
