import { notesQuery } from './notesDb';

export interface EdgeRow {
  team_id: string;
  team_name: string;
  contact_id: string;
  weight: number;
  notes: number;
  meetings: number;
  poc: number;
  documents: number;
  links: number;
  last_activity: Date | null;
}

/**
 * Aggregates every interaction between team members and contacts, now with a
 * per-type breakdown and the most recent activity timestamp per edge.
 *
 * NOTE: assumes all five tables have a created_at column (they do in the
 * migrations we wrote). If contact_poc uses a different timestamp column,
 * adjust its SELECT line.
 */
export async function getNetworkEdges(): Promise<EdgeRow[]> {
  const rows = await notesQuery<{
    team_id: string; team_name: string; contact_id: string;
    weight: number | string; notes: number | string; meetings: number | string;
    poc: number | string; documents: number | string; links: number | string;
    last_activity: Date | null;
  }>(
    `WITH activity AS (
       SELECT username, contact_id, 'note'     AS kind, created_at FROM contact_notes
       UNION ALL
       SELECT username, contact_id, 'meeting'  AS kind, created_at FROM contact_meetings
       UNION ALL
       SELECT username, contact_id, 'poc'      AS kind, created_at FROM contact_poc
       UNION ALL
       SELECT username, contact_id, 'document' AS kind, created_at FROM contact_documents
       UNION ALL
       SELECT username, contact_id, 'link'     AS kind, created_at FROM contact_links
     )
     SELECT ut.team_id,
            t.team_name,
            a.contact_id,
            COUNT(*)::int                                      AS weight,
            COUNT(*) FILTER (WHERE a.kind = 'note')::int       AS notes,
            COUNT(*) FILTER (WHERE a.kind = 'meeting')::int    AS meetings,
            COUNT(*) FILTER (WHERE a.kind = 'poc')::int        AS poc,
            COUNT(*) FILTER (WHERE a.kind = 'document')::int   AS documents,
            COUNT(*) FILTER (WHERE a.kind = 'link')::int       AS links,
            MAX(a.created_at)                                  AS last_activity
     FROM activity a
     JOIN user_teams ut ON ut.username = a.username
     JOIN teams t       ON t.team_id  = ut.team_id
     GROUP BY ut.team_id, t.team_name, a.contact_id`
  );

  const n = (v: number | string) => (typeof v === 'string' ? parseInt(v, 10) : v);

  return rows.map((r) => ({
    team_id: r.team_id,
    team_name: r.team_name,
    contact_id: r.contact_id,
    weight: n(r.weight),
    notes: n(r.notes),
    meetings: n(r.meetings),
    poc: n(r.poc),
    documents: n(r.documents),
    links: n(r.links),
    last_activity: r.last_activity,
  }));
}

// Member count per team (for hover cards)
export async function getTeamMemberCounts(): Promise<Map<string, number>> {
  const rows = await notesQuery<{ team_id: string; count: string }>(
    `SELECT team_id, COUNT(*) AS count FROM user_teams GROUP BY team_id`
  );
  return new Map(rows.map((r) => [r.team_id, parseInt(r.count, 10)]));
}

// Team IDs the user belongs to
export async function getUserTeamIds(username: string): Promise<string[]> {
  const rows = await notesQuery<{ team_id: string }>(
    `SELECT team_id FROM user_teams WHERE username = $1`,
    [username]
  );
  return rows.map((r) => r.team_id);
}

// Contact IDs the user has marked themselves PoC for
export async function getUserPocContactIds(username: string): Promise<string[]> {
  const rows = await notesQuery<{ contact_id: string }>(
    `SELECT contact_id FROM contact_poc WHERE username = $1`,
    [username]
  );
  return rows.map((r) => r.contact_id);
}
