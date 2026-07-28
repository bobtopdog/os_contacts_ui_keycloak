import { NextRequest, NextResponse } from 'next/server';
import { getUserGroups, createGroup } from '@/libs/meetingGroupsRepository';

/**
 * GET /api/meeting-groups?username=xxx
 * Returns the groups the user belongs to (with their role).
 */
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username');

  if (!username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username query parameter is required.' },
      { status: 400 }
    );
  }

  try {
    const groups = await getUserGroups(username.trim());
    return NextResponse.json({ data: groups });
  } catch (err) {
    console.error('GET /api/meeting-groups error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/meeting-groups
 * Body: { name, username }
 * Any user can create a group; they become its creator and first admin.
 */
export async function POST(request: NextRequest) {
  let body: { name?: string; username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { name, username } = body;

  if (!name?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'name is required.' },
      { status: 400 }
    );
  }
  if (!username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username is required.' },
      { status: 400 }
    );
  }

  try {
    const group = await createGroup(name.trim(), username.trim());
    return NextResponse.json({ data: group }, { status: 201 });
  } catch (err) {
    console.error('POST /api/meeting-groups error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
