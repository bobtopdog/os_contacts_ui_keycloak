import { notesQuery } from './notesDb';
import type { AdminOutcome, AdminSubOutcome } from '@/types/outcomeAdmin';

// The four tables that carry outcome columns — keep in sync with the
// TARGET_TABLES list in scripts/migrate-outcomes.js.
const USAGE_SOURCE = `
  SELECT outcome_id, sub_outcome_id FROM contact_anex_notes
  UNION ALL SELECT outcome_id, sub_outcome_id FROM contact_links
  UNION ALL SELECT outcome_id, sub_outcome_id FROM contact_meetings
  UNION ALL SELECT outcome_id, sub_outcome_id FROM contact_documents
`;

/** Full tree for the admin page, inactive rows included, with usage counts. */
export async function getAdminOutcomeTree(): Promise<AdminOutcome[]> {
  const [outcomeRows, subRows] = await Promise.all([
    notesQuery<{
      outcome_id: number; code: string; label: string; sort_order: number;
      active: boolean; usage_count: string;
    }>(
      `WITH usage AS (${USAGE_SOURCE})
       SELECT o.outcome_id, o.code, o.label, o.sort_order, o.active,
              (SELECT COUNT(*) FROM usage u WHERE u.outcome_id = o.outcome_id)::text AS usage_count
       FROM outcomes o
       ORDER BY o.sort_order, o.code`
    ),
    notesQuery<{
      sub_outcome_id: number; outcome_id: number; code: string; label: string;
      sort_order: number; active: boolean; usage_count: string;
    }>(
      `WITH usage AS (${USAGE_SOURCE})
       SELECT s.sub_outcome_id, s.outcome_id, s.code, s.label, s.sort_order, s.active,
              (SELECT COUNT(*) FROM usage u WHERE u.sub_outcome_id = s.sub_outcome_id)::text AS usage_count
       FROM sub_outcomes s
       ORDER BY s.sort_order, s.code`
    ),
  ]);

  const subsByParent = new Map<number, AdminSubOutcome[]>();
  for (const s of subRows) {
    const list = subsByParent.get(s.outcome_id) ?? [];
    list.push({
      subOutcomeId: s.sub_outcome_id,
      outcomeId: s.outcome_id,
      code: s.code,
      label: s.label,
      sortOrder: s.sort_order,
      active: s.active,
      usageCount: parseInt(s.usage_count, 10),
    });
    subsByParent.set(s.outcome_id, list);
  }

  return outcomeRows.map((o) => ({
    outcomeId: o.outcome_id,
    code: o.code,
    label: o.label,
    sortOrder: o.sort_order,
    active: o.active,
    usageCount: parseInt(o.usage_count, 10),
    subs: subsByParent.get(o.outcome_id) ?? [],
  }));
}

// ---------------------------------------------------------------------------
// Writes. No deletes by design — deactivate instead, so records keep their value.
// Codes are set on create and never changed afterwards (they're the stable key).
// ---------------------------------------------------------------------------

export async function createOutcome(
  code: string, label: string, sortOrder: number
): Promise<number> {
  const rows = await notesQuery<{ outcome_id: number }>(
    `INSERT INTO outcomes (code, label, sort_order, active)
     VALUES ($1, $2, $3, true) RETURNING outcome_id`,
    [code, label, sortOrder]
  );
  return rows[0].outcome_id;
}

export async function updateOutcome(
  outcomeId: number, label: string, sortOrder: number, active: boolean
): Promise<boolean> {
  const rows = await notesQuery<{ outcome_id: number }>(
    `UPDATE outcomes SET label = $1, sort_order = $2, active = $3
     WHERE outcome_id = $4 RETURNING outcome_id`,
    [label, sortOrder, active, outcomeId]
  );
  return rows.length > 0;
}

export async function createSubOutcome(
  outcomeId: number, code: string, label: string, sortOrder: number
): Promise<number> {
  const rows = await notesQuery<{ sub_outcome_id: number }>(
    `INSERT INTO sub_outcomes (outcome_id, code, label, sort_order, active)
     VALUES ($1, $2, $3, $4, true) RETURNING sub_outcome_id`,
    [outcomeId, code, label, sortOrder]
  );
  return rows[0].sub_outcome_id;
}

/**
 * The parent outcome is deliberately NOT editable: records store the
 * (sub_outcome_id, outcome_id) pair under a composite foreign key, so moving
 * a sub-outcome to another parent would break every record already using it.
 * To "move" one, deactivate it and create a new one under the right parent.
 */
export async function updateSubOutcome(
  subOutcomeId: number, label: string, sortOrder: number, active: boolean
): Promise<boolean> {
  const rows = await notesQuery<{ sub_outcome_id: number }>(
    `UPDATE sub_outcomes SET label = $1, sort_order = $2, active = $3
     WHERE sub_outcome_id = $4 RETURNING sub_outcome_id`,
    [label, sortOrder, active, subOutcomeId]
  );
  return rows.length > 0;
}

/** True if a pg error is a unique violation (duplicate code). */
export function isDuplicateCode(err: unknown): boolean {
  return (err as { code?: string })?.code === '23505';
}
