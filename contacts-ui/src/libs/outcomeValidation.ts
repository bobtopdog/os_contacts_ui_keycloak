import type { OutcomeValue } from '@/types/outcome';

/**
 * Server-side parsing for the outcome pair, shared by all four API routes.
 * Accepts numbers, numeric strings (FormData), '', null or undefined.
 *
 *   const parsed = parseOutcome(body.outcomeId, body.subOutcomeId);
 *   if ('error' in parsed) return NextResponse.json({ error: 'Bad Request', message: parsed.error }, { status: 400 });
 *   // parsed.outcomeId / parsed.subOutcomeId → pass to the repository
 *
 * Whether the sub actually belongs to the outcome is enforced by the
 * database's composite foreign key — see isOutcomeFkError below.
 */
export function parseOutcome(
  rawOutcome: unknown, rawSub: unknown
): OutcomeValue | { error: string } {
  const toId = (v: unknown): number | null | 'invalid' => {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : parseInt(String(v), 10);
    return Number.isInteger(n) && n > 0 ? n : 'invalid';
  };

  const outcomeId = toId(rawOutcome);
  const subOutcomeId = toId(rawSub);

  if (outcomeId === 'invalid' || subOutcomeId === 'invalid') {
    return { error: 'Invalid outcome selection.' };
  }
  if (subOutcomeId !== null && outcomeId === null) {
    return { error: 'A sub-outcome cannot be selected without an outcome.' };
  }
  return { outcomeId, subOutcomeId };
}

/**
 * True if a pg error came from the outcome constraints (sub-outcome not
 * belonging to the outcome, or a non-existent id). Map these to a 400
 * instead of a 500 in your route's catch block.
 */
export function isOutcomeFkError(err: unknown): boolean {
  const e = err as { code?: string; constraint?: string };
  return (e?.code === '23503' || e?.code === '23514')
    && !!e.constraint && /outcome/.test(e.constraint);
}
