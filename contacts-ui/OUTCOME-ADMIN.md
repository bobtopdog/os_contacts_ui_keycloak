# Admin → Outcomes tab

## Files

| File | Action |
|---|---|
| `src/types/outcomeAdmin.ts` | New |
| `src/libs/outcomeAdminRepository.ts` | New — tree with usage counts, create/update (no delete) |
| `src/libs/outcomeAdminInput.ts` | New — shared validation |
| `src/app/api/admin/outcomes/route.ts` | New — GET tree, POST outcome |
| `src/app/api/admin/outcomes/[id]/route.ts` | New — PATCH outcome |
| `src/app/api/admin/sub-outcomes/route.ts` | New — POST sub-outcome |
| `src/app/api/admin/sub-outcomes/[id]/route.ts` | New — PATCH sub-outcome |
| `src/components/admin/OutcomesAdminSection.tsx` | New — the tab |
| `scripts/seed-outcomes.js` | REPLACE — now refuses to overwrite existing rows |

No migration. All routes use your existing `requireAdmin()` from
`src/libs/adminAuth.ts`. Next.js matches the static `/api/admin/outcomes`
folder before your dynamic `/api/admin/[kind]`, so they don't clash.

## Manual patch — src/app/admin/page.tsx (3 edits)

**1. Import + tab type**, under the existing imports:

    import OutcomesAdminSection from '@/components/admin/OutcomesAdminSection';

    type AdminTab = LookupKind | 'outcomes';


**2. Widen the TABS type, add the tab, and widen the state:**

    const TABS: { kind: AdminTab; label: string; nameLabel: string; showUrl?: boolean }[] = [
      ...your existing three...
      { kind: 'outcomes', label: '🎯 Outcomes', nameLabel: 'Outcome' },
    ];

    const [activeTab, setActiveTab] = useState<AdminTab>('tags');

**3. Render the right section** — replace the `<AdminLookupSection ... />` block:

    {current.kind === 'outcomes' ? (
      <OutcomesAdminSection />
    ) : (
      <AdminLookupSection
        key={current.kind}
        kind={current.kind}
        title={current.label}
        nameLabel={current.nameLabel}
        showUrl={current.showUrl}
      />
    )}

(TypeScript narrows `current.kind` to `LookupKind` in the else-branch, so
`AdminLookupSection` keeps its existing prop type.)

## What the tab does

- Lists outcomes in sort order; ▼ expands each to its sub-outcomes
- Add outcome / add sub-outcome (code, label, sort order — order defaults to next free)
- Edit label, sort order and Active inline
- Shows **usage counts** — how many notes/links/meetings/documents use each value
- Warns before deactivating something that's in use, and explains what happens
- Saving refreshes the user-facing dropdowns immediately (their 30-min cache is invalidated)

## Rules (enforced server-side, not just hidden in the UI)

| Rule | Why |
|---|---|
| No delete | Records keep their value; retire with Active instead |
| Code fixed after creation | It's the stable key the seed and any reports match on |
| Sub-outcome can't change parent | Records store the (sub, outcome) pair under a composite FK — moving it would break them. Retire it and create a new one under the right parent |
| Duplicate code → 409 | Codes are unique across each table |

## The seed script from now on

Admin is now the source of truth. The seed is for an empty table only:

    npm run db:seed:outcomes                     # empty table: loads
                                                 # existing rows: refuses, explains
    npm run db:seed:outcomes -- --force          # upsert over existing rows
    npm run db:seed:outcomes -- --force --prune  # also retire unlisted values

`--force` overwrites labels/order edited in admin and re-activates retired
values listed in the file, so use it deliberately.
