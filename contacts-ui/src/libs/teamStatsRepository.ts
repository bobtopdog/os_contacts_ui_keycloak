import { notesQuery } from './notesDb';
import type { TeamWeeklyStats, MemberActivity, RecentNote } from '@/types/teamStats';

// ---------------------------------------------------------------------------
// All stats are scoped to:
//   - the members of the given team (from user_teams)
//   - the current calendar week, Monday 00:00 → next Monday 00:00
//     (PostgreSQL's date_trunc('week', ...) is ISO — weeks start on Monday)
//
// "Recorded this week" is based on created_at (when the entry was made),
// not meeting_date. Swap the WHERE clauses to meeting_date if the client
// prefers counting by when meetings happened rather than when logged.
// ---------------------------------------------------------------------------

const WEEK_FILTER = `created_at >= date_trunc('week', NOW())
                 AND created_at <  date_trunc('week', NOW()) + interval '7 days'`;

async function getTeamMemberUsernames(teamId: string): Promise<string[]> {
  const rows = await notesQuery<{ username: string }>(
    `SELECT username FROM user_teams WHERE team_id = $1`,
    [teamId]
  );
  return rows.map((r) => r.username);
}

export async function getTeamWeeklyStats(teamId: string): Promise<TeamWeeklyStats> {
  const members = await getTeamMemberUsernames(teamId);

  // Week boundaries for display
  const weekRows = await notesQuery<{ week_start: Date; week_end: Date }>(
    `SELECT date_trunc('week', NOW())::date AS week_start,
            (date_trunc('week', NOW()) + interval '6 days')::date AS week_end`
  );
  const weekStart = weekRows[0].week_start.toISOString().split('T')[0];
  const weekEnd = weekRows[0].week_end.toISOString().split('T')[0];

  // No members → return zeroed stats without touching the other tables
  if (members.length === 0) {
    return {
      weekStart, weekEnd,
      memberCount: 0,
      clientMeetingsCount: 0,
      ministerMeetingsCount: 0,
      notesCount: 0,
      recentNotes: [],
      scoreTotals: { score1: 0, score2: 0, score3: 0, score4: 0 },
      memberActivity: [],
      recentClientMeetings: [],
      recentMinisterMeetings: [],
    };
  }

  // Run all aggregations in parallel — each filtered by team members + week
  const [
    clientMeetingRows,
    ministerMeetingRows,
    noteCountRows,
    recentNoteRows,
    scoreRows,
    notesByUser,
    clientMeetingsByUser,
    ministerMeetingsByUser,
    linksByUser,
    documentsByUser,
    recentClientMeetingRows,
    recentMinisterMeetingRows,
  ] = await Promise.all([
    // 1. Client meetings count
    notesQuery<{ count: string }>(
      `SELECT COUNT(*) AS count FROM contact_meetings
       WHERE username = ANY($1) AND ${WEEK_FILTER}`,
      [members]
    ),
    // 3. Minister meetings count
    notesQuery<{ count: string }>(
      `SELECT COUNT(*) AS count FROM minister_meetings
       WHERE username = ANY($1) AND ${WEEK_FILTER}`,
      [members]
    ),
    // 4a. Notes count
    notesQuery<{ count: string }>(
      `SELECT COUNT(*) AS count FROM contact_anex_notes
       WHERE username = ANY($1) AND ${WEEK_FILTER}`,
      [members]
    ),
    // 4b. Recent notes for the overview (latest 5)
    notesQuery<{
      note_id: string; contact_id: string; username: string;
      comment: string; created_at: Date;
    }>(
      `SELECT note_id, contact_id, username, comment, created_at
       FROM contact_anex_notes
       WHERE username = ANY($1) AND ${WEEK_FILTER}
       ORDER BY created_at DESC
       LIMIT 5`,
      [members]
    ),
    // 5. Score totals (per category)
    notesQuery<{ s1: string; s2: string; s3: string; s4: string }>(
      `SELECT COALESCE(SUM(score1),0) AS s1, COALESCE(SUM(score2),0) AS s2,
              COALESCE(SUM(score3),0) AS s3, COALESCE(SUM(score4),0) AS s4
       FROM contact_meetings
       WHERE username = ANY($1) AND ${WEEK_FILTER}`,
      [members]
    ),
    // 2. Per-member activity — one grouped query per table
    notesQuery<{ username: string; count: string }>(
      `SELECT username, COUNT(*) AS count FROM contact_anex_notes
       WHERE username = ANY($1) AND ${WEEK_FILTER} GROUP BY username`,
      [members]
    ),
    notesQuery<{ username: string; count: string }>(
      `SELECT username, COUNT(*) AS count FROM contact_meetings
       WHERE username = ANY($1) AND ${WEEK_FILTER} GROUP BY username`,
      [members]
    ),
    notesQuery<{ username: string; count: string }>(
      `SELECT username, COUNT(*) AS count FROM minister_meetings
       WHERE username = ANY($1) AND ${WEEK_FILTER} GROUP BY username`,
      [members]
    ),
    notesQuery<{ username: string; count: string }>(
      `SELECT username, COUNT(*) AS count FROM contact_links
       WHERE username = ANY($1) AND ${WEEK_FILTER} GROUP BY username`,
      [members]
    ),
    notesQuery<{ username: string; count: string }>(
      `SELECT username, COUNT(*) AS count FROM contact_documents
       WHERE username = ANY($1) AND ${WEEK_FILTER} GROUP BY username`,
      [members]
    ),
   notesQuery<{
     meeting_id: string; contact_id: string; username: string;
     meeting_date: Date; title: string;
   }>(
     `SELECT meeting_id, contact_id, username, meeting_date,
             COALESCE(title, '') AS title
      FROM contact_meetings
      WHERE username = ANY($1)
      ORDER BY meeting_date DESC, created_at DESC
      LIMIT 5`,
     [members]
   ),
   notesQuery<{
     meeting_id: string; minister_id: number; username: string;
     meeting_date: Date; title: string;
   }>(
     `SELECT meeting_id, minister_id, username, meeting_date, title
      FROM minister_meetings
      WHERE username = ANY($1)
      ORDER BY meeting_date DESC, created_at DESC
      LIMIT 5`,
     [members]
   ),

  ]);

  // Build a lookup: username → counts per activity type
  const activityMap = new Map<string, MemberActivity>();
  for (const username of members) {
    activityMap.set(username, {
      username,
      notes: 0, clientMeetings: 0, ministerMeetings: 0,
      links: 0, documents: 0, total: 0,
    });
  }

  const applyCounts = (
    rows: { username: string; count: string }[],
    field: keyof Omit<MemberActivity, 'username' | 'total'>
  ) => {
    for (const row of rows) {
      const entry = activityMap.get(row.username);
      if (entry) entry[field] = parseInt(row.count, 10);
    }
  };

  applyCounts(notesByUser, 'notes');
  applyCounts(clientMeetingsByUser, 'clientMeetings');
  applyCounts(ministerMeetingsByUser, 'ministerMeetings');
  applyCounts(linksByUser, 'links');
  applyCounts(documentsByUser, 'documents');

     const recentClientMeetings = recentClientMeetingRows.map((r) => ({
     meetingId: r.meeting_id,
     contactId: r.contact_id,
     username: r.username,
     meetingDate: r.meeting_date.toISOString().split('T')[0],
     title: r.title,
   }));

   const recentMinisterMeetings = recentMinisterMeetingRows.map((r) => ({
     meetingId: r.meeting_id,
     ministerId: r.minister_id,
     username: r.username,
     meetingDate: r.meeting_date.toISOString().split('T')[0],
     title: r.title,
   }));

  const memberActivity = Array.from(activityMap.values())
    .map((m) => ({
      ...m,
      total: m.notes + m.clientMeetings + m.ministerMeetings + m.links + m.documents,
    }))
    .sort((a, b) => b.total - a.total); // most active first

  const recentNotes: RecentNote[] = recentNoteRows.map((r) => ({
    noteId: r.note_id,
    contactId: r.contact_id,
    username: r.username,
    comment: r.comment,
    createdAt: r.created_at.toISOString(),
  }));

  return {
    weekStart,
    weekEnd,
    memberCount: members.length,
    clientMeetingsCount: parseInt(clientMeetingRows[0].count, 10),
    ministerMeetingsCount: parseInt(ministerMeetingRows[0].count, 10),
    notesCount: parseInt(noteCountRows[0].count, 10),
    recentNotes,
    recentClientMeetings,
    recentMinisterMeetings,
    scoreTotals: {
      score1: parseInt(scoreRows[0].s1, 10),
      score2: parseInt(scoreRows[0].s2, 10),
      score3: parseInt(scoreRows[0].s3, 10),
      score4: parseInt(scoreRows[0].s4, 10),
    },
    memberActivity,
  };
}
