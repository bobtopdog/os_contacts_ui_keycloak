import { NextRequest, NextResponse } from 'next/server';
import { updateCommunityNote, deleteCommunityNote } from '@/libs/communityPagesRepository';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Ctx = { params: Promise<{ noteId: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { noteId } = await params;
  let body: { username?: string; comment?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Bad Request', message: 'Invalid JSON body' }, { status: 400 }); }
  const username = body.username?.trim() ?? '';
  const comment = body.comment?.trim() ?? '';
  if (!UUID.test(noteId) || !username || !comment) return NextResponse.json({ error: 'Bad Request', message: 'username and comment are required.' }, { status: 400 });
  try {
    const note = await updateCommunityNote(noteId, username, comment);
    if (!note) return NextResponse.json({ error: 'Forbidden', message: 'Note not found or not yours.' }, { status: 403 });
    return NextResponse.json({ data: note });
  } catch (err) {
    console.error('PATCH community note error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { noteId } = await params;
  let username = '';
  try { username = ((await request.json()).username as string)?.trim() ?? ''; } catch { /* handled below */ }
  if (!UUID.test(noteId) || !username) return NextResponse.json({ error: 'Bad Request', message: 'username is required.' }, { status: 400 });
  try {
    const ok = await deleteCommunityNote(noteId, username);
    if (!ok) return NextResponse.json({ error: 'Forbidden', message: 'Note not found or not yours.' }, { status: 403 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE community note error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}
