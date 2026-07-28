import { NextRequest, NextResponse } from 'next/server';
import { getContactIdsByCommunity } from '@/libs/communitiesRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * GET /api/communities/:communityId/contacts
 * Returns all contact IDs that have been tagged with this community.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  const { communityId } = await params;

  if (!isValidUuid(communityId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid community ID.' },
      { status: 400 }
    );
  }

  try {
    const contactIds = await getContactIdsByCommunity(communityId);
    return NextResponse.json({ data: contactIds });
  } catch (err) {
    console.error('GET community contacts error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
