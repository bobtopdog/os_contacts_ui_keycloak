/** The 3-step meeting assessment. All parts optional; each step depends on the one before. */
export interface MeetingAssessment {
  purposes: string[];        // Step 1 — up to 2 codes
  outcome: string | null;    // Step 2 — one code, only if Step 1 has a selection
  significant: string[];     // Step 3 — any number, only if Step 2 is set
}

export const EMPTY_ASSESSMENT: MeetingAssessment = { purposes: [], outcome: null, significant: [] };
