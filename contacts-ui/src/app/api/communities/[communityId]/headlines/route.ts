import { NextRequest, NextResponse } from 'next/server';
import { getCommunityHeadlines, createCommunityHeadline, isCommunityMember } from '@/libs/communityPagesRepository';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Ctx = { params: Promise<{ communityId: string }> };

/** GET — all headlines (anyone can read) */
export async function GET(_r: NextRequest, { params }: Ctx) {
  const { communityId } = await params;
  if (!UUID.test(communityId)) return NextResponse.json({ error: 'Bad Request', message: 'Invalid community ID.' }, { status: 400 });
  try {
    return NextResponse.json({ data: await getCommunityHeadlines(communityId) });
  } catch (err) {
    console.error('GET headlines error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}

/** POST — members only. Body: { username, title, body } */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { communityId } = await params;
  let b: { username?: string; title?: string; body?: string };
  try { b = await request.json(); } catch { return NextResponse.json({ error: 'Bad Request', message: 'Invalid JSON body' }, { status: 400 }); }
  const username = b.username?.trim() ?? '';
  const title = b.title?.trim() ?? '';
  const body = b.body?.trim() ?? '';
  if (!UUID.test(communityId) || !username || !title) return NextResponse.json({ error: 'Bad Request', message: 'username and title are required.' }, { status: 400 });
  try {
    if (!(await isCommunityMember(communityId, username))) {
      return NextResponse.json({ error: 'Forbidden', message: 'Only community members can add headlines.' }, { status: 403 });
    }
    return NextResponse.json({ data: await createCommunityHeadline(communityId, username, title, body) }, { status: 201 });
  } catch (err) {
    console.error('POST headline error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}
