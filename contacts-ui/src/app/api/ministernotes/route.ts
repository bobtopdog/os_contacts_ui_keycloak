import { NextRequest, NextResponse } from 'next/server';
import { createNote } from '@/libs/ministers/notesRepository';


/**
 * POST /api/notes
 *
 * Body (JSON):
 * {
 *   "memberId": 123,
 *   "username":  "john.doe",
 *   "comment":   "Called to discuss renewal."
 * }
 */
export async function POST(request: NextRequest) {
  let body: { memberId?: number; username?: string; comment?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { memberId, username, comment } = body;

  if (!username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username is required.' },
      { status: 400 }
    );
  }
  if (!comment?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'comment must not be empty.' },
      { status: 400 }
    );
  }

  try {
    const note = await createNote(memberId!, username.trim(), comment.trim());
    return NextResponse.json({ data: note }, { status: 201 });
  } catch (err) {
    console.error('POST /api/ministernotes error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
