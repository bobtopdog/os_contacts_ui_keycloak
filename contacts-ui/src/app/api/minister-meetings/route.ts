import { NextRequest, NextResponse } from 'next/server';
import { createMinisterMeeting } from '@/libs/ministerMeetingsRepository';

/**
 * POST /api/minister-meetings
 * Body: { ministerId, username, meetingDate, title, comments }
 */
export async function POST(request: NextRequest) {
  let body: {
    ministerId?: number | string;
    username?: string;
    meetingDate?: string;
    title?: string;
    comments?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { ministerId, username, meetingDate, title, comments = '' } = body;

  const ministerIdNum = parseInt(String(ministerId), 10);
  if (isNaN(ministerIdNum) || ministerIdNum <= 0) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'A valid ministerId is required.' },
      { status: 400 }
    );
  }
  if (!username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username is required.' },
      { status: 400 }
    );
  }
  if (!meetingDate) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'meetingDate is required.' },
      { status: 400 }
    );
  }
  if (!title?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'title is required.' },
      { status: 400 }
    );
  }

  try {
    const meeting = await createMinisterMeeting(
      ministerIdNum,
      username.trim(),
      meetingDate,
      title.trim(),
      comments.trim()
    );
    return NextResponse.json({ data: meeting }, { status: 201 });
  } catch (err) {
    console.error('POST /api/minister-meetings error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
