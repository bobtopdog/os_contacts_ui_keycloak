import { NextRequest, NextResponse } from 'next/server';
import {
  getCommunityPocs, addCommunityPoc, removeCommunityPoc, isCommunityMember,
} from '@/libs/communityPagesRepository';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Ctx = { params: Promise<{ communityId: string }> };

/** GET — list PoCs (anyone) */
export async function GET(_r: NextRequest, { params }: Ctx) {
  const { communityId } = await params;
  if (!UUID.test(communityId)) return NextResponse.json({ error: 'Bad Request', message: 'Invalid community ID.' }, { status: 400 });
  try {
    return NextResponse.json({ data: await getCommunityPocs(communityId) });
  } catch (err) {
    console.error('GET community poc error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}

async function readUsername(request: NextRequest): Promise<string> {
  try { return ((await request.json()).username as string)?.trim() ?? ''; } catch { return ''; }
}

/** POST — mark self as PoC (members only). Body: { username } */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { communityId } = await params;
  const username = await readUsername(request);
  if (!UUID.test(communityId) || !username) return NextResponse.json({ error: 'Bad Request', message: 'communityId and username are required.' }, { status: 400 });
  try {
    if (!(await isCommunityMember(communityId, username))) {
      return NextResponse.json({ error: 'Forbidden', message: 'Only community members can be a PoC.' }, { status: 403 });
    }
    await addCommunityPoc(communityId, username);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('POST community poc error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}

/** DELETE — remove self as PoC. Body: { username } */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { communityId } = await params;
  const username = await readUsername(request);
  if (!UUID.test(communityId) || !username) return NextResponse.json({ error: 'Bad Request', message: 'communityId and username are required.' }, { status: 400 });
  try {
    await removeCommunityPoc(communityId, username);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE community poc error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}
