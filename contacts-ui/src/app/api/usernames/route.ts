import { NextRequest, NextResponse } from 'next/server';
import { notesQuery } from '@/libs/notesDb';

/**
 * GET /api/usernames?q=par
 * Returns up to 10 distinct usernames starting with the query (case-insensitive),
 * sourced from user_teams.
 *
 * NOTE: only users who have joined at least one team appear here. To broaden
 * the source, UNION additional tables, e.g.:
 *
 *   SELECT DISTINCT username FROM (
 *     SELECT username FROM user_teams
 *     UNION SELECT username FROM contact_notes
 *     UNION SELECT username FROM meeting_group_members
 *   ) u WHERE username ILIKE $1 ORDER BY username LIMIT 10
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    // Require at least 2 characters to avoid returning the whole user base
    return NextResponse.json({ data: [] });
  }

  try {
    const rows = await notesQuery<{ username: string }>(
      `SELECT DISTINCT username
       FROM user_teams
       WHERE username ILIKE $1
       ORDER BY username
       LIMIT 10`,
      [`${q}%`]
    );
    return NextResponse.json({ data: rows.map((r) => r.username) });
  } catch (err) {
    console.error('GET /api/usernames error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
