import { NextRequest, NextResponse } from 'next/server';
import { updateCommunityHeadline, deleteCommunityHeadline } from '@/libs/communityPagesRepository';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Ctx = { params: Promise<{ headlineId: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { headlineId } = await params;
  let b: { username?: string; title?: string; body?: string };
  try { b = await request.json(); } catch { return NextResponse.json({ error: 'Bad Request', message: 'Invalid JSON body' }, { status: 400 }); }
  const username = b.username?.trim() ?? '';
  const title = b.title?.trim() ?? '';
  const body = b.body?.trim() ?? '';
  if (!UUID.test(headlineId) || !username || !title) return NextResponse.json({ error: 'Bad Request', message: 'username and title are required.' }, { status: 400 });
  try {
    const h = await updateCommunityHeadline(headlineId, username, title, body);
    if (!h) return NextResponse.json({ error: 'Forbidden', message: 'Headline not found or not yours.' }, { status: 403 });
    return NextResponse.json({ data: h });
  } catch (err) {
    console.error('PATCH headline error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { headlineId } = await params;
  let username = '';
  try { username = ((await request.json()).username as string)?.trim() ?? ''; } catch { /* handled below */ }
  if (!UUID.test(headlineId) || !username) return NextResponse.json({ error: 'Bad Request', message: 'username is required.' }, { status: 400 });
  try {
    const ok = await deleteCommunityHeadline(headlineId, username);
    if (!ok) return NextResponse.json({ error: 'Forbidden', message: 'Headline not found or not yours.' }, { status: 403 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE headline error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}
