import { notesQuery } from './notesDb';
import type { Outcome } from '@/types/outcome';

/**
 * Full outcome tree INCLUDING inactive values — the UI hides inactive ones
 * from new selections but still needs their labels to display old records.
 */
export async function getOutcomeTree(): Promise<Outcome[]> {
  const rows = await notesQuery<{
    outcome_id: number; o_code: string; o_label: string; o_active: boolean;
    sub_outcome_id: number | null; s_code: string | null; s_label: string | null; s_active: boolean | null;
  }>(
    `SELECT o.outcome_id, o.code AS o_code, o.label AS o_label, o.active AS o_active,
            s.sub_outcome_id, s.code AS s_code, s.label AS s_label, s.active AS s_active
     FROM outcomes o
     LEFT JOIN sub_outcomes s ON s.outcome_id = o.outcome_id
     ORDER BY o.sort_order, o.code, s.sort_order, s.code`
  );

  const map = new Map<number, Outcome>();
  for (const r of rows) {
    if (!map.has(r.outcome_id)) {
      map.set(r.outcome_id, {
        outcomeId: r.outcome_id, code: r.o_code, label: r.o_label, active: r.o_active, subs: [],
      });
    }
    if (r.sub_outcome_id !== null) {
      map.get(r.outcome_id)!.subs.push({
        subOutcomeId: r.sub_outcome_id, code: r.s_code!, label: r.s_label!, active: !!r.s_active,
      });
    }
  }
  return Array.from(map.values());
}
