# Admin Lookup Management — Integration

## Files

| File | Purpose |
|------|---------|
| `scripts/migrate-admin-lookup.js` | Adds description+active to tags & areas, active to teams |
| `src/types/adminLookup.ts` | Shared normalised item type |
| `src/libs/adminAuth.ts` | Server-side admin role gate (requireAdmin) |
| `src/libs/adminLookupRepository.ts` | list / listActive / create / update (NO delete) |
| `src/app/api/admin/[kind]/route.ts` | GET all + POST (admin only) |
| `src/app/api/admin/[kind]/[id]/route.ts` | PATCH (admin only; deliberately no DELETE) |
| `src/app/api/lookup/[kind]/route.ts` | Public active-only tags/areas for reference lists |
| `src/components/admin/AdminLookupSection.tsx` | Generic list/add/edit table |
| `src/app/admin/page.tsx` | The tabbed /admin page with role gate |
| `src/components/LookupReference.tsx` | Read-only listing for the user help page |

## Setup

1. Run the migration:

       "db:migrate:admin-lookup": "node scripts/migrate-admin-lookup.js"
       npm run db:migrate:admin-lookup

   Existing rows all become active=true, so nothing disappears.

2. Copy the files in. One dynamic [kind] route serves all three tables —
   no per-table route duplication.

3. Nav link, shown only to admins (in your Navbar client component):

       const roles = session?.user?.roles ?? [];
       {roles.includes('admin') && (
         <Link href="/admin" className="nav-link">⚙️ Admin</Link>
       )}

4. Help page reference listings (anywhere on your help page):

       import LookupReference from '@/components/LookupReference';

       <LookupReference kind="tags"  title="🏷️ Tags" />
       <LookupReference kind="areas" title="🗺️ Areas" />

5. YOUR step — add `AND active = true` (or `WHERE active = true`) to every
   query that feeds a user-facing dropdown for tags, areas and teams, e.g.
   the teams list in getProfileTeams. Admin listings deliberately show all.

## Keycloak role

The role name is 'admin' in TWO places — src/libs/adminAuth.ts (the real
gate, used by the API routes) and the ADMIN_ROLE constant in
src/app/admin/page.tsx (cosmetic UI gate). Change both if your realm uses
a different name. Roles arrive via session.user.roles, populated from
realm_access.roles by the jwt callback we set up with Keycloak.

## Design notes

- No DELETE endpoints exist at all — deactivation is the only removal.
  Inactive rows show greyed with a badge in admin, and vanish from user
  dropdowns once you add the active=true filters.
- The three tables have different column names (tag / area / team_name);
  the repository maps them all to a common {id, name, description, active}
  shape so ONE component serves every tab. Teams additionally expose
  intranet_url.
- Table names are whitelisted through the TABLES map — the [kind] URL
  segment can never inject an arbitrary table name.
