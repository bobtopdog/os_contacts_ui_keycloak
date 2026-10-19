'use client';

import { useOutcomes } from '@/hooks/useOutcomes';

/**
 * Displays a record's outcome as a small badge, e.g. "Fo2 › Fo2b".
 * Renders nothing if no outcome is set. Labels come from the shared cached
 * lookup, so repository queries only need to return the two ids.
 *
 *   <OutcomeBadge outcomeId={note.outcomeId} subOutcomeId={note.subOutcomeId} />
 */
export default function OutcomeBadge({
  outcomeId, subOutcomeId,
}: { outcomeId: number | null | undefined; subOutcomeId: number | null | undefined }) {
  const { data: outcomes } = useOutcomes();
  if (!outcomeId || !outcomes) return null;

  const o = outcomes.find((x) => x.outcomeId === outcomeId);
  if (!o) return null;
  const s = subOutcomeId ? o.subs.find((x) => x.subOutcomeId === subOutcomeId) : undefined;

  return (
    <span
      className="badge bg-success bg-opacity-75 rounded-pill"
      title={s ? `Outcome ${o.label}, sub-outcome ${s.label}` : `Outcome ${o.label}`}
    >
      🎯 {o.label}{s && <> &rsaquo; {s.label}</>}
    </span>
  );
}
