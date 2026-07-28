import { NextRequest, NextResponse } from 'next/server';
import { getTeamWeeklyStats } from '@/libs/teamStatsRepository';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * GET /api/teams/:teamId/stats
 * Returns weekly aggregated stats for the team:
 * client meetings, minister meetings, notes, score totals, member activity.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;

  if (!isValidUuid(teamId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid team ID.' },
      { status: 400 }
    );
  }

  try {
    const stats = await getTeamWeeklyStats(teamId);
    return NextResponse.json({ data: stats });
  } catch (err) {
    console.error(`GET /api/teams/${teamId}/stats error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
