import { NextRequest, NextResponse } from 'next/server';
import { getCommunityMeetings } from '@/libs/communityPagesRepository';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** GET /api/communities/:communityId/meetings — meetings tagged with this community */
export async function GET(_r: NextRequest, { params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = await params;
  if (!UUID.test(communityId)) return NextResponse.json({ error: 'Bad Request', message: 'Invalid community ID.' }, { status: 400 });
  try {
    return NextResponse.json({ data: await getCommunityMeetings(communityId) });
  } catch (err) {
    console.error('GET community meetings error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}
