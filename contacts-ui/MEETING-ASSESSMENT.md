# Meeting assessment (3-step) — Integration

## Files

| File | Action |
|---|---|
| `scripts/migrate-meeting-assessment.js` | New — run once |
| `src/types/meetingAssessment.ts` | New |
| `src/libs/meetingAssessmentConfig.ts` | New — ✏️ the option lists live here |
| `src/components/MeetingAssessment.tsx` | New — editor + read-only summary |
| `src/types/contact.ts` | Changed — `assessment` on `ContactMeeting` |
| `src/libs/api.ts` | Changed — `assessment` in post/patch meeting payloads |
| `src/libs/meetingsRepository.ts` | Changed — 3 new columns through SELECT/INSERT/UPDATE |
| `src/app/api/meetings/route.ts` | Changed — validates on create |
| `src/app/api/meetings/meeting/[meetingId]/route.ts` | Changed — validates on edit |
| `src/components/ContactMeetings.tsx` | Changed — editor under the stars (add + edit), summary in view |

⚠️ The changed files are built on the versions you sent on Thursday **plus
last night's date fix** (`toDateOnly`, `formatDate`, `emptyForm`). If you've
changed any of those six files since, don't overwrite — apply
`meeting-assessment.diff` instead (it's measured against that baseline).

Type-checked clean (strict) against Next 15 / NextAuth 4 / React Query 5.

## Setup

    "db:migrate:meeting-assessment": "node scripts/migrate-meeting-assessment.js"
    npm run db:migrate:meeting-assessment

Then restart the dev server. Existing meetings get an empty assessment.

## Behaviour

| Step | Rule |
|---|---|
| 1 Primary engagement purpose | Up to 2; once 2 are ticked the rest disable; counter shows "1/2" |
| 2 Outcome against purpose | One only (ticking another replaces it; untick to clear). Locked until Step 1 has a selection |
| 3 Significant outcomes | Any number. Locked until Step 2 is set |

- Clearing a step clears the steps after it, so a dependent answer can't
  linger hidden and be saved without the answer it depends on.
- All three steps are optional.
- View mode shows a compact summary under the star ratings (purpose badges,
  colour-coded outcome — red / amber / green — and significant outcomes);
  meetings with no assessment show nothing.

## Enforced three times

UI (locking + cascade clear) → `parseAssessment()` in both routes (known
codes only, max 2, step dependencies) → database CHECK constraints (max 2,
outcome needs purpose, significant needs outcome).

## Changing the wording later

Edit the labels in `meetingAssessmentConfig.ts`. The database stores codes,
so existing meetings show the new wording immediately. Don't change or
remove a code once it's in use — add a new one instead.

## Wording I corrected from the request — check with the client

- "PArtially achievedAcchieved" → two options: **Partially achieved**, **Achieved**
- "Barrier of disagreement identified" → **Barrier or disagreement identified**
- "Significiant", "Seniour intevention" → **Significant**, **Senior intervention**
