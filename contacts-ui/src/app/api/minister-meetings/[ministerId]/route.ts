import { NextRequest, NextResponse } from 'next/server';
import { getMinisterMeetings } from '@/libs/ministerMeetingsRepository';

/**
 * GET /api/minister-meetings/:ministerId
 * Returns all meetings for a given minister, newest first.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ministerId: string }> }
) {
  const { ministerId } = await params;
  const idNum = parseInt(ministerId, 10);

  if (isNaN(idNum) || idNum <= 0) {
    return NextResponse.json(
      { error: 'Bad Request', message: `"${ministerId}" is not a valid minister ID.` },
      { status: 400 }
    );
  }

  try {
    const meetings = await getMinisterMeetings(idNum);
    return NextResponse.json({ data: meetings });
  } catch (err) {
    console.error(`GET /api/minister-meetings/${ministerId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
