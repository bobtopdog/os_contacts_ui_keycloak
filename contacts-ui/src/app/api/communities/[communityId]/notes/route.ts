import { NextRequest, NextResponse } from 'next/server';
import { getMyCommunityNote, createCommunityNote, isCommunityMember } from '@/libs/communityPagesRepository';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Ctx = { params: Promise<{ communityId: string }> };

/** GET ?username= — the caller's own private note (or null) */
export async function GET(request: NextRequest, { params }: Ctx) {
  const { communityId } = await params;
  const username = request.nextUrl.searchParams.get('username')?.trim() ?? '';
  if (!UUID.test(communityId) || !username) return NextResponse.json({ error: 'Bad Request', message: 'communityId and username are required.' }, { status: 400 });
  try {
    return NextResponse.json({ data: await getMyCommunityNote(communityId, username) });
  } catch (err) {
    console.error('GET community note error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}

/** POST — create (members only, one per user). Body: { username, comment } */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { communityId } = await params;
  let body: { username?: string; comment?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Bad Request', message: 'Invalid JSON body' }, { status: 400 }); }
  const username = body.username?.trim() ?? '';
  const comment = body.comment?.trim() ?? '';
  if (!UUID.test(communityId) || !username || !comment) return NextResponse.json({ error: 'Bad Request', message: 'username and comment are required.' }, { status: 400 });
  try {
    if (!(await isCommunityMember(communityId, username))) {
      return NextResponse.json({ error: 'Forbidden', message: 'Only community members can add notes.' }, { status: 403 });
    }
    const note = await createCommunityNote(communityId, username, comment);
    if (!note) return NextResponse.json({ error: 'Conflict', message: 'You already have a note for this community.' }, { status: 409 });
    return NextResponse.json({ data: note }, { status: 201 });
  } catch (err) {
    console.error('POST community note error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}
