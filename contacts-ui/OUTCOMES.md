# Outcome / Sub-outcome Dropdowns — Integration Guide



## Files

| File | Purpose |
|---|---|
| `scripts/migrate-outcomes.js` | Lookup tables + `outcome_id`/`sub_outcome_id` on the 4 anex tables |
| `scripts/seed-outcomes.js` | ✏️ Edit the values here, re-run any time |
| `src/types/outcome.ts` | Types + `EMPTY_OUTCOME` |
| `src/libs/outcomeRepository.ts` | Reads the tree |
| `src/libs/outcomeValidation.ts` | `parseOutcome()` + `isOutcomeFkError()` for your API routes |
| `src/app/api/lookups/outcomes/route.ts` | GET the tree |
| `src/hooks/useOutcomes.ts` | Shared cached lookup |
| `src/components/OutcomeSelector.tsx` | The shared cascading dropdowns |
| `src/components/OutcomeBadge.tsx` | Display "🎯 Fo2 › Fo2b" on list cards |

## Setup

Add to package.json and run in this order:

    "db:migrate:outcomes": "node scripts/migrate-outcomes.js",
    "db:seed:outcomes":    "node scripts/seed-outcomes.js"

    npm run db:migrate:outcomes
    npm run db:seed:outcomes

⚠️ Check `TARGET_TABLES` at the top of the migration matches your real
table names (especially the anex notes table) before running. The
migration runs in a transaction, so a wrong name rolls everything back.

## When the real values arrive

Edit the `OUTCOMES` array in `seed-outcomes.js` and re-run. Matching is on
`code`: labels and order update in place, and anything you remove is set
`active = false` (hidden from dropdowns) rather than deleted, so existing
records keep their value. Records using a retired value still display it,
and editing such a record shows it as "(retired)".

Tip: once real data exists, treat codes as permanent and change labels.

## Applying to each component — the same 5 edits × 4

Do these for ContactAnexNotes, ContactLinks, ContactMeetings and
ContactDocuments.

### 1. Type — add to the record interface (src/types/contact.ts)

    outcomeId: number | null;
    subOutcomeId: number | null;

### 2. Repository — three touches

- Add `outcome_id, sub_outcome_id` to every SELECT and RETURNING list
- Add `outcomeId: row.outcome_id, subOutcomeId: row.sub_outcome_id` to the row mapper
- Add both to the INSERT columns/values and the UPDATE SET clause, e.g.

      INSERT INTO contact_links (contact_id, username, reference, label, outcome_id, sub_outcome_id)
      VALUES ($1, $2, $3, $4, $5, $6)

  with `outcomeId, subOutcomeId` as extra parameters to the function.

### 3. API route (POST and PATCH)

    import { parseOutcome, isOutcomeFkError } from '@/libs/outcomeValidation';

    const parsed = parseOutcome(body.outcomeId, body.subOutcomeId);
    if ('error' in parsed) {
      return NextResponse.json({ error: 'Bad Request', message: parsed.error }, { status: 400 });
    }
    // pass parsed.outcomeId, parsed.subOutcomeId to the repository

and in the catch block, before the 500:

    if (isOutcomeFkError(err)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'That sub-outcome does not belong to the chosen outcome.' },
        { status: 400 }
      );
    }

### 4. api.ts client functions

Add `outcomeId: number | null; subOutcomeId: number | null;` to the
post/patch payload types — for JSON bodies they flow through
`JSON.stringify(payload)` with no other change.

**Documents are the exception** (FormData, not JSON). In `uploadDocument`:

    formData.append('outcomeId', outcome.outcomeId?.toString() ?? '');
    formData.append('subOutcomeId', outcome.subOutcomeId?.toString() ?? '');

and in the upload route read them with `formData.get('outcomeId')` —
`parseOutcome` already treats `''` as "not set".

### 5. Component

    import OutcomeSelector from '@/components/OutcomeSelector';
    import OutcomeBadge from '@/components/OutcomeBadge';
    import { EMPTY_OUTCOME, type OutcomeValue } from '@/types/outcome';

Add form:

    const [outcome, setOutcome] = useState<OutcomeValue>(EMPTY_OUTCOME);
    ...
    <OutcomeSelector value={outcome} onChange={setOutcome} disabled={isSaving} />
    ...
    // include in the save payload:
    ...outcome,
    // and reset after a successful save:
    setOutcome(EMPTY_OUTCOME);

Edit mode — initialise from the record:

    const [editOutcome, setEditOutcome] = useState<OutcomeValue>({
      outcomeId: item.outcomeId, subOutcomeId: item.subOutcomeId,
    });

View mode — show it alongside the existing badges:

    <OutcomeBadge outcomeId={item.outcomeId} subOutcomeId={item.subOutcomeId} />

## Behaviour

- Both dropdowns optional; sub-outcome disabled until an outcome is chosen
- Changing the outcome clears the sub-outcome
- Enforced three times: the UI, `parseOutcome()` in the routes, and the
  database (CHECK constraint + composite FK). A sub-outcome from the wrong
  parent is impossible to store, however the request is built.
- One shared lookup request per page, cached 30 min, used by every
  selector and badge
- Existing records are untouched — the new columns are NULL until edited

## Later, if needed

- Outcomes in the admin page: the tables follow the same
  code/label/active pattern as tags/areas, so an admin tab is a small
  extension of `AdminLookupSection`
- Team stats by outcome: a `GROUP BY outcome_id` over the four tables
