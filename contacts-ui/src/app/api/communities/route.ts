import { NextRequest, NextResponse } from 'next/server';
import { getUserCommunities, createCommunity } from '@/libs/communitiesRepository';
//import { getUserCommunities } from '@/libs/communitiesRepository';
import { createCommunityWithGroup } from '@/libs/communityPagesRepository';

/**
 * GET /api/communities?username=xxx
 * Returns communities the user belongs to.
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
    const communities = await getUserCommunities(username.trim());
    return NextResponse.json({ data: communities });
  } catch (err) {
    console.error('GET /api/communities error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/communities
 * Body: { name, description, username }
 */
export async function POST(request: NextRequest) {
  let body: { name?: string; description?: string; username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { name, description = '', username } = body;

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
    //const community = await createCommunity(name.trim(), description.trim(), username.trim());
    const community = await createCommunityWithGroup(name.trim(), description.trim(), username.trim());
    return NextResponse.json({ data: community }, { status: 201 });
  } catch (err) {
    console.error('POST /api/communities error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
