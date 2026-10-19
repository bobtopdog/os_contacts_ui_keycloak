import type { MeetingAssessment } from '@/types/meetingAssessment';

// ---------------------------------------------------------------------------
// Meeting assessment options.
//
// ✏️ Labels can be reworded freely here — the database stores the CODES, so
//    existing meetings pick up the new wording automatically.
// ⚠️ Don't change or remove a code once meetings use it; add a new one instead.
// ---------------------------------------------------------------------------

export interface AssessmentOption {
  code: string;
  label: string;
}

export const MAX_PURPOSES = 2;

export const PURPOSE_OPTIONS: AssessmentOption[] = [
  { code: 'influencing_policy',       label: 'Influencing policy' },
  { code: 'requirement_gathering',    label: 'Requirement gathering' },
  { code: 'relationship_development', label: 'Relationship development' },
  { code: 'planning',                 label: 'Planning' },
  { code: 'delivery',                 label: 'Delivery' },
];

export const OUTCOME_OPTIONS: AssessmentOption[] = [
  { code: 'not_achieved',          label: 'Not achieved' },
  { code: 'partially_achieved',    label: 'Partially achieved' },
  { code: 'achieved',              label: 'Achieved' },
  { code: 'exceeded_expectations', label: 'Exceeded expectations' },
];

export const SIGNIFICANT_OPTIONS: AssessmentOption[] = [
  { code: 'action_complete',          label: 'Action complete' },
  { code: 'commitment_secured',       label: 'Commitment secured' },
  { code: 'new_opportunity',          label: 'New opportunity identified' },
  { code: 'barrier_or_disagreement',  label: 'Barrier or disagreement identified' },
  { code: 'significant_insight',      label: 'Significant insight gained' },
  { code: 'senior_intervention',      label: 'Senior intervention required' },
  { code: 'follow_up_agreed',         label: 'Follow-up action agreed' },
];

const labelMap = new Map(
  [...PURPOSE_OPTIONS, ...OUTCOME_OPTIONS, ...SIGNIFICANT_OPTIONS].map((o) => [o.code, o.label])
);

/** Label for a stored code; falls back to the code if an option was removed. */
export function assessmentLabel(code: string): string {
  return labelMap.get(code) ?? code;
}

/**
 * Server-side validation, shared by the POST and PATCH routes. Checks every
 * code is known, enforces the max-2 rule and the step dependencies.
 * A missing/undefined assessment is treated as empty (all optional).
 */
export function parseAssessment(raw: unknown): MeetingAssessment | { error: string } {
  if (raw === undefined || raw === null) return { purposes: [], outcome: null, significant: [] };
  if (typeof raw !== 'object') return { error: 'Invalid assessment.' };

  const r = raw as Record<string, unknown>;
  const asCodes = (v: unknown): string[] | null =>
    v === undefined || v === null ? [] :
    Array.isArray(v) && v.every((x) => typeof x === 'string') ? [...new Set(v as string[])] : null;

  const purposes = asCodes(r.purposes);
  const significant = asCodes(r.significant);
  const rawOutcome = r.outcome;
  if (rawOutcome !== undefined && rawOutcome !== null && typeof rawOutcome !== 'string') {
    return { error: 'Invalid assessment format.' };
  }
  const outcome: string | null = typeof rawOutcome === 'string' && rawOutcome !== '' ? rawOutcome : null;

  if (!purposes || !significant) {
    return { error: 'Invalid assessment format.' };
  }

  const known = (opts: AssessmentOption[], code: string) => opts.some((o) => o.code === code);
  if (!purposes.every((c) => known(PURPOSE_OPTIONS, c))) return { error: 'Unknown engagement purpose.' };
  if (outcome !== null && !known(OUTCOME_OPTIONS, outcome)) return { error: 'Unknown outcome against purpose.' };
  if (!significant.every((c) => known(SIGNIFICANT_OPTIONS, c))) return { error: 'Unknown significant outcome.' };

  if (purposes.length > MAX_PURPOSES) {
    return { error: `Select at most ${MAX_PURPOSES} engagement purposes.` };
  }
  if (outcome !== null && purposes.length === 0) {
    return { error: 'Choose an engagement purpose before the outcome.' };
  }
  if (significant.length > 0 && outcome === null) {
    return { error: 'Choose the outcome before significant outcomes.' };
  }

  return { purposes, outcome, significant };
}
