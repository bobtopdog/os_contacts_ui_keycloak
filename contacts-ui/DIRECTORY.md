# Corporate Directory Lookup — Integration

## Files

| File | Action |
|---|---|
| `src/types/directory.ts` | New |
| `src/app/api/users/[username]/directory/route.ts` | New — server-side proxy to the corporate API |
| `src/hooks/useDirectoryUser.ts` | New — cached lookup hook + `displayName()` helper |
| `src/components/UserDisplayName.tsx` | New — drop-in "real name" renderer for anywhere |
| `src/components/UserSummaryLink.tsx` | REPLACE — real name on the link and in the modal, plus email/phone strip |

No migration.

## Env vars (frontend Deployment)

    DIRECTORY_API_BASE_URL=https://<host>:8443/rest/v3
    # Only if the service needs it:
    # DIRECTORY_API_TOKEN=...

If the directory service uses the corporate CA you set up for Keycloak,
NODE_EXTRA_CA_CERTS already covers it. If it uses a different CA, append
that certificate to the same PEM file (certificates can be concatenated).

## Why a proxy route rather than calling the API from the browser

- It's on another host/port → CORS, and it's probably not reachable from
  outside the network anyway.
- Keeps the URL and any token out of client-side code.
- Server-side calls honour NODE_EXTRA_CA_CERTS; browsers wouldn't.
- Next caches each lookup server-side for 10 min (`revalidate: 600`), and
  TanStack Query caches it in the browser for 30 min — directory data
  changes rarely.

## Behaviour

- Team members table now shows "John Smith" rather than "smithj1"; hover
  shows the username. Add `showUsername` to render "John Smith (smithj1)"
  if the client wants both visible.
- Modal header shows the real name with @username beneath; a grey strip
  gives mailto:/tel: links for email and telephone.
- If the directory has no record (404), or the service is down, everything
  gracefully falls back to the raw username — nothing breaks.

## Response-shape note

The route reads `firstname`, `lastname`, `telephoneNumber`, `email` from the
record, accepting either a bare object or one wrapped in `{ data: … }`. If
the real JSON nests them differently (e.g. `attributes.firstname`), adjust
the four lines in the route — test with:

    curl -s https://<host>:8443/rest/v3/users/<you>/infoplus | head -40

## Rolling it out everywhere

`UserDisplayName` is a one-for-one replacement for any `{x.username}` in the
app — note cards, meeting cards, headline authors, community members, team
stats table. Same cache, so no extra requests for repeated names.
