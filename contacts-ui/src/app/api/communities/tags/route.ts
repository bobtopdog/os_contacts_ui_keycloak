import { NextRequest, NextResponse } from 'next/server';
import { addContactTag } from '@/libs/communitiesRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * POST /api/communities/tags
 * Body: { contactId, communityId, taggedBy }
 * The user must be a member of the community.
 */
export async function POST(request: NextRequest) {
  let body: { contactId?: string; communityId?: string; taggedBy?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { contactId, communityId, taggedBy } = body;

  if (!contactId || !isValidUuid(contactId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'A valid contactId is required.' },
      { status: 400 }
    );
  }
  if (!communityId || !isValidUuid(communityId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'A valid communityId is required.' },
      { status: 400 }
    );
  }
  if (!taggedBy?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'taggedBy is required.' },
      { status: 400 }
    );
  }

  try {
    const tag = await addContactTag(contactId, communityId, taggedBy.trim());

    if (!tag) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You must be a member of the community to tag a contact.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: tag }, { status: 201 });
  } catch (err) {
    console.error('POST tag error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected POST error occurred' },
      { status: 500 }
    );
  }
}
