export interface AdminSubOutcome {
  subOutcomeId: number;
  outcomeId: number;
  code: string;
  label: string;
  sortOrder: number;
  active: boolean;
  usageCount: number;   // records across the 4 anex tables using this sub-outcome
}

export interface AdminOutcome {
  outcomeId: number;
  code: string;
  label: string;
  sortOrder: number;
  active: boolean;
  usageCount: number;   // records across the 4 anex tables using this outcome
  subs: AdminSubOutcome[];
}

/** Body for creating/updating either level. `code` is only used on create. */
export interface OutcomeInput {
  code?: string;
  label: string;
  sortOrder: number;
  active: boolean;
}
