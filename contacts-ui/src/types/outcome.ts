export interface SubOutcome {
  subOutcomeId: number;
  code: string;
  label: string;
  active: boolean;
}

export interface Outcome {
  outcomeId: number;
  code: string;
  label: string;
  active: boolean;
  subs: SubOutcome[];
}

/** The pair stored on each anex record. Both optional; sub requires outcome. */
export interface OutcomeValue {
  outcomeId: number | null;
  subOutcomeId: number | null;
}

export const EMPTY_OUTCOME: OutcomeValue = { outcomeId: null, subOutcomeId: null };
