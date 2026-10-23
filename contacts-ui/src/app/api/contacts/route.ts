import { NextRequest, NextResponse } from 'next/server';
import { searchLivePeople, LiveAuthError } from '@/libs/liveContactsServer';

/**
 * GET /api/contacts?q=David&organisation=<org uuid>
 * Browser-facing proxy to the live people search. Adds the user's Keycloak
 * token server-side, so the token never reaches the browser and CORS never
 * applies. Response keeps the app's { data, pagination } shape.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  const organisation = request.nextUrl.searchParams.get('organisation') ?? '';

  try {
    return NextResponse.json(await searchLivePeople(q, organisation));
  } catch (err) {
    if (err instanceof LiveAuthError) {
      return NextResponse.json({ error: 'Unauthorized', message: err.message }, { status: 401 });
    }
    console.error('GET /api/contacts error:', err);
    return NextResponse.json(
      { error: 'Bad Gateway', message: 'The contacts service could not be reached.' }, { status: 502 });
  }
}
