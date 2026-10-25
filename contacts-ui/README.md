# OPUS STORM: Developer Handbook

Oct 23, 2026

## Overview

Contacts CRM is a Next.js app where client staff record their engagement with external contacts. The contact records come from the client's live corporate contacts service. Everything the app adds (notes, meetings, documents, links, communities, teams) is stored in its own PostgreSQL database.

Use this handbook to take over the code: how it fits together, how to run it, where each feature lives, and what has gone wrong before. Each feature folder also has its own integration note (`*.md`); this handbook replaces them as the single starting point.

### Projects

| Project | Port | Purpose | Status |
| --- | --- | --- | --- |
| `contacts-ui` (also called contacts-frontend) | 3000 | The app: UI, its own API routes, the notes DB connection | Production |
| `contacts-api` | 3001 | Demo contacts API used during build and UAT | Retired for production, replaced by the live service |
| `parliament-members-api` | 3002 | Ministers and members lookup used by minister meetings | Production |
| Live corporate contacts service | n/a | Source of truth for people and organisations (`/api/v1`) | Client-owned |
| Corporate directory | 8443 | Real names, email, phone for usernames (`/rest/v3/users/<id>/infoplus`) | Client-owned |

### Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript strict |
| Data fetching | TanStack Query v5 in client components; repositories on the server |
| Auth | NextAuth v4.24 with Keycloak (PKI certificate sign-in) |
| UI | Bootstrap 5 (CSS and JS bundle), MDI and Bootstrap icons |
| Database | PostgreSQL via `pg`, raw SQL in repository files |
| Email | nodemailer through the corporate SMTP relay |
| Graphs | `react-force-graph-2d` (network page), loaded client-only |
| Hosting | OpenShift, built by GitLab CI |

## Architecture

The browser only ever talks to `contacts-ui`. Its API routes then call the live contacts service (adding the user's Keycloak token), the notes database, the directory and SMTP. Nothing secret, and nothing on another host, is called from the browser.

&#91;embedded content: contacts-ui and the services it calls\]

The highlighted box is the live-contacts layer: the only place that knows the live service's field names and holds the user's token.

### The contacts adapter

The live service's field names differ from the app's. `src/libs/contactsAdapter.ts` is the only file that knows the live shapes; everything else uses `ContactSummary` and `ContactDetail`.

| App field | `/people` field | `/profiles/{id}` field |
| --- | --- | --- |
| `personId` | `userID` (capital D) | `userId` |
| `fullName` | `firstname` + `surname` | `firstname` + `surname` |
| `organisation` | `organisation` | `organisation` |
| `role` | `description` | `title` |
| `email` | `email` | `email` |
| `workPhone` | `worktelephone` | `workphone` |
| `homePhone` | `telephone` | `telephone` |
| `updatedAt` | none | `mod_date` |
| `createdAt` | none | none (always empty) |

- `joinName()` skips the surname if `firstname` already ends with it (sample data has `firstname: "David Jones"`).
- `people: null` means no matches and becomes an empty list.
- Search returns at most 20 people (data protection). `pagination.total` carries the full count, so the UI can say "refine your search".
- The organisation filter takes the organisation's UUID `id`, not its name.

### Where to call contacts from

| Calling from | Import | Why |
| --- | --- | --- |
| Client component (`'use client'`) | `searchContacts`, `getContact`, `getOrganisations` in `src/libs/api.ts` | Relative URLs to `/api/contacts…`; same origin, so no CORS, and the token stays server-side |
| Server component or route handler | `searchLivePeople`, `getLiveProfile`, `getLiveOrganisations` in `src/libs/liveContactsServer.ts` | Calls the live service directly with the token |

The `api.ts` contact functions throw if called on the server, on purpose. A relative URL has no host there, and the error tells you which import to use instead.

### Notes API URL

The app's own data (notes, meetings and so on) goes through `NOTES_API` in `api.ts`. In the browser it can be `''`, giving relative URLs that work in every environment. Server code should call the repository functions directly rather than making HTTP requests to itself.

### Other external calls

- **Corporate directory:** `/api/users/[username]/directory` proxies to the directory. It's cached for 10 minutes on the server and 30 minutes in the browser, and falls back to the raw username on a 404 or outage. `UserDisplayName` renders the real name anywhere.
- **Parliament members API:** minister names resolve through `/api/members/${id}` (field `name_display_as`), cached client-side by `MinisterName`.
- **SMTP:** `src/libs/email.ts` and `communityNotify.ts`. With `SMTP_HOST` unset, emails are logged to the console instead.

## Local setup and environment

You need Node 20 or later, PostgreSQL and a `.env.local` file; then `npm install`, run the migrations in order (see Database) and `npm run dev`. Never commit `.env*` files or put them in zips: they hold secrets.

1. Clone `contacts-ui` and run `npm install`.
2. Create an empty Postgres database and set the database variables below.
3. Run each `db:migrate:*` script in the order listed in the Database section, then the seed scripts.
4. Sign in. Locally this is GitHub OAuth, which gives a hard-coded `admin` role so admin pages work; live contact calls need a real Keycloak token, so they return 401 in this mode.
5. Kill a stuck port with `lsof -ti:3000 | xargs kill -9`.

### Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` (or `PGHOST`, `PGUSER`, …) | Runtime secret | Notes database |
| `NEXTAUTH_URL` | Runtime | The app's public URL |
| `NEXTAUTH_SECRET` | Runtime secret | Encrypts the session cookie. Must be identical across replicas and deploys |
| `KEYCLOAK_ISSUER` | Runtime | The realm's `issuer` value, e.g. `https://…/realms/<realm>`. Not the authorization endpoint |
| `KEYCLOAK_CLIENT_ID` | Runtime | Keycloak client |
| `KEYCLOAK_CLIENT_SECRET` | Runtime secret | Sign-in and token refresh |
| `LIVE_CONTACTS_API_URL` | Runtime | Live contacts base, ending `/api/v1` |
| `DIRECTORY_API_BASE_URL` | Runtime | `https://<host>:8443/rest/v3` |
| `DIRECTORY_API_TOKEN` | Runtime secret | Only if the directory needs it |
| `ADMIN_GROUP` | Runtime | AD group name that grants admin |
| `NEXT_PUBLIC_ADMIN_GROUP` | Build | Only if a client component checks admin |
| `NEXT_PUBLIC_NOTES_API_URL` | Build | Leave `''` for same-origin calls |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM` | Runtime | Corporate relay. Unset = emails logged to console |
| `SMTP_USER`, `SMTP_PASSWORD` | Runtime secret | Only if the relay needs auth |
| `EMAIL_DOMAIN` | Runtime | Email address = `username@EMAIL_DOMAIN` |
| `NODE_EXTRA_CA_CERTS` | Runtime | Absolute path to the corporate CA bundle (PEM; certificates can be concatenated) |

`NEXT_PUBLIC_*` values are compiled into the browser bundle at build time. Changing them in a running pod does nothing; set them as build arguments. Everything else needs only a pod restart: `oc rollout restart deployment/contacts-frontend`.

Retired with the live switch: `NEXT_PUBLIC_API_BASE_URL` and `CONTACTS_API_INTERNAL_URL` (the demo contacts API). Never set `NODE_TLS_REJECT_UNAUTHORIZED=0`; fix certificates with `NODE_EXTRA_CA_CERTS` instead.

## Authentication and authorisation

Users never see a login screen. Keycloak signs them in silently with their PKI certificate, NextAuth keeps the session in an encrypted cookie, and admin rights come from an AD group in the token.

### Sign-in flow

1. The user opens any page.
2. `src/middleware.ts` (`proxy.ts` in Next 16 naming) finds no session and hands over to NextAuth.
3. With Keycloak as the only provider and no `pages.signIn` set, NextAuth redirects straight to Keycloak.
4. Keycloak authenticates from the PKI certificate and redirects back with tokens.
5. The user lands on the page they asked for.

### Callbacks (`src/app/api/auth/[...nextauth]/route.ts`)

- **`jwt`** copies `username`, `roles` (from `realm_access.roles`) and `groups` from the Keycloak profile onto the token. Its last line is `return keepKeycloakTokenFresh(token, account)` (`src/libs/authTokenCallbacks.ts`), which stores the access token, refresh token and expiry at sign-in and refreshes the access token a minute before it expires (Keycloak tokens last about 5 minutes).
- **`session`** copies `username`, `roles`, `groups` and `error` onto `session.user`. It must never copy `accessToken` or `refreshToken`: the browser can read the session at `/api/auth/session`.
- Types: `src/types/next-auth.d.ts` (user fields) and `src/types/next-auth-tokens.d.ts` (token fields). TypeScript merges them.

### Calling the live service as the user

`getAccessToken()` in `src/libs/keycloakToken.ts` reads the token from the session cookie on the server, in pages and route handlers alike. `getToken()` reassembles chunked cookies, which matters because Keycloak sessions often exceed 4 KB. `liveContactsServer.ts` sends it as `Authorization: Bearer …`. A 401 or 403 from the service becomes a 401 from the proxy; a 404 stays a 404; anything else becomes a 502 and is logged.

`SessionProvider refetchInterval={4 * 60}` keeps the cookie's token fresh while a tab is left open. If a refresh fails, `session.error` is `RefreshAccessTokenError`; the client can call `signIn('keycloak')`.

### Admin access

- `isAdminUser(user)` in `src/libs/adminCheck.ts` is the one check. It passes if `groups` contains `ADMIN_GROUP` (matched on the last path segment, case-insensitive, so `/AD/Dept/Name` works) or `roles` contains `admin`.
- `requireAdmin()` in `src/libs/adminAuth.ts` is the real gate for every `/api/admin/*` route; it returns the username or `null` (403).
- `src/app/admin/page.tsx` and the navbar link use the same helper, but only to hide UI.
- To check the claim format, open your profile and click **Show all claims**. No `groups` claim means the Keycloak client needs a Group Membership mapper with token claim name `groups` (an IT job).
- Once the group works in production, remove the `admin` role fallback.

### Demo bypass and dev logins

There is a hard-coded demo user for when Keycloak is down, and GitHub OAuth for laptop dev. Neither has a Keycloak access token, so live contact calls fail there. Never enable the bypass in production.

## Database

One PostgreSQL database holds everything the app records. Contacts are not stored; rows refer to them by the live service's `userId` (e.g. `smithD_10`) in a `contact_id` column. Production starts empty apart from lookup values.

### Tables

| Area | Tables |
| --- | --- |
| Contact activity | `contact_notes`, `contact_anex_notes`, `contact_meetings`, `contact_meeting_links`, `contact_documents` (file bytes as `bytea`), `contact_links`, `contact_poc` |
| Lookups | `tags`, `areas`, `teams` (all with `active`), `outcomes`, `sub_outcomes` |
| Contact tagging | contact tags, areas and highlights tables (one row per contact and value) |
| Teams and people | `user_teams`, `user_profiles` (about-me text) |
| Communities | `communities`, `community_members`, `community_contact_tags`, `community_meeting_tags`, `community_poc`, `community_headlines`, `community_notes` |
| Email groups | `meeting_groups` (one per community, `community_id`), `meeting_group_members` (role `admin` or `viewer`), `meeting_group_tags` |
| Ministers | `minister_meetings` (minister ids are INTs from the members API) |

### Migration scripts (`scripts/`, run in this order)

Each has an `npm run db:migrate:<name>` script. Most use `IF NOT EXISTS`, but check a script before re-running it. The original core tables (notes, meetings, links, POCs, tags, areas, teams) predate these scripts; see Open items.

1. `migrate-documents.js`
2. `migrate-communities.js`
3. `migrate-community-meeting-tags.js`
4. `migrate-meeting-groups.js`
5. `migrate-minister-meetings.js`
6. `migrate-meeting-title.js`
7. `migrate-admin-lookup.js` (adds `description` and `active`)
8. `migrate-user-profiles.js`
9. `migrate-document-category.js`
10. `migrate-community-pages.js`: **destructive**, deletes all existing meeting groups. Harmless on an empty database; never run it on live data without a backup.
11. `migrate-outcomes.js`: check `TARGET_TABLES` matches the real table names first.
12. `migrate-meeting-assessment.js` (`assess_purposes`, `assess_outcome`, `assess_significant` with CHECK constraints)
13. `migrate-contact-ids.js`: finds every UUID `contact_id`/`person_id` column and changes it to `VARCHAR(255)`. Run without arguments for a dry run, then with `--apply`.

Seed: `seed-outcomes.js` loads outcome values into an empty table only. On existing rows it refuses unless `--force` (add `--prune` to retire unlisted values). After launch, the admin page is the source of truth.

### Conventions

- **IDs:** the app's own ids (note, meeting, document, link) are UUIDs, checked with `isValidUuid`. Contact ids are not, so check them with `isValidContactId` from `src/libs/contactId.ts`.
- **No hard deletes for lookups:** tags, areas, teams and outcomes are retired with `active = false`. User-facing dropdowns filter on `active = true`; admin shows all.
- **Codes are permanent:** outcomes and assessment options store codes. Change labels freely, but never change or reuse a code.
- **Dates:** `pg` parses a `DATE` as local midnight, so `toISOString()` shifts it back a day in BST. Always format with `toDateOnly()` from `src/libs/dateOnly.ts`, and parse with `new Date(y, m - 1, d)`.
- **Unquoted names are lower-cased** by Postgres: map `row.outcome_id`, never `row.outcome_Id`.
- **Ownership:** writes check `WHERE username = $x` in SQL as well as in the UI, returning 403 or 409.

## Feature areas

Every feature follows the same path: a table, a repository in `src/libs`, API routes under `src/app/api`, client functions in `api.ts` (or a feature `*Api.ts`), and a component. The table says where each one lives and what rules it enforces.

| Feature | Key files | Rules worth knowing |
| --- | --- | --- |
| Contact search and detail | `app/page.tsx` (search), `app/contacts/[id]/page.tsx`, `SearchBar`, `ContactSearchLimitNotice` | Max 20 results; the organisation dropdown value is the org `id` |
| Notes (private) and anex notes | `ContactNotes`, `ContactAnexNotes`, `notesRepository`, `anexNotesRepository` | Notes visible to their author only (enforced in SQL). A note can be moved to private via a CTE |
| Meetings | `ContactMeetings`, `meetingsRepository`, `/api/meetings` | Four star-scored categories, title, date (`toDateOnly`), document links, outcome, assessment, community tag |
| Meeting assessment | `meetingAssessmentConfig.ts` (option lists), `MeetingAssessment.tsx` | Step 1 up to 2 purposes, step 2 one outcome, step 3 any. Clearing a step clears later ones. Enforced in UI, `parseAssessment()` and DB CHECKs |
| Documents | `ContactDocuments`, `documentsRepository`, `documentConfig.ts` | 2 MB cap in the route. Category required, from `DOCUMENT_CATEGORIES`; the category string is stored. No edit mode, so outcome is set at upload |
| Links (OpenText) | `ContactLinks`, `linksRepository` | Reference implementation for outcomes: one shared `COLUMNS` constant for every query |
| Outcomes | `OutcomeSelector`, `OutcomeBadge`, `useOutcomes`, `outcomeValidation.ts` | Optional; sub-outcome needs its outcome. Composite FK makes a wrong parent impossible. One cached lookup (30 min) per page |
| Points of contact, tags, areas, headlines | contact detail components | Tags and areas only show `active` values |
| Teams and team stats | `TeamPage`, `components/teamStats/*`, `teamStatsRepository` | All stat cards share key `['team-weekly-stats', teamId]`: one request. Weeks run Monday to Sunday, counted by `created_at` |
| Communities | `app/communities`, `components/community/*`, `communityPagesRepository` | Anyone views; members add PoC, headlines, private notes; owner manages members. Each community auto-creates one email group |
| Community email groups | `CommunityEmailGroup`, `/api/meeting-groups/*` (members, roles, CSV) | Tagging a meeting with a community emails its group. Only the owner grants admin |
| Minister meetings | `minister_meetings`, `MinisterName` | Minister ids are INTs; names from the members API |
| Network | `app/network`, `NetworkGraph`, `networkRepository`, `/api/network` | Counts every note, meeting, PoC, document and link per team and contact. Client-only (`next/dynamic`, `ssr: false`). PDF export with user id, date and "for internal use only" |
| About me and user summary | `UserSummaryLink`, `userProfileRepository`, `UsernameAutocomplete` | Usernames suggested from `user_teams`; free typing still allowed |
| Admin | `app/admin`, `components/admin/*`, `/api/admin/[kind]`, `/api/admin/outcomes` | List, add, edit; no delete. Codes and parents fixed. `[kind]` is whitelisted. Static `/api/admin/outcomes` wins over `[kind]` |
| Help page lookups | `LookupReference`, `/api/lookup/[kind]` | Read-only, active values only |

## Code conventions

Keep server-only code (database, tokens, secrets) out of anything a client component imports. Most build failures so far have come from breaking that rule.

### Folder layout

| Folder | Holds |
| --- | --- |
| `src/app` | Pages and API routes (`route.ts`) |
| `src/components` | UI; feature subfolders such as `admin/`, `community/`, `teamStats/` |
| `src/libs` | Repositories (`*Repository.ts`, server only), client API functions (`api.ts`, `*Api.ts`), config and validation helpers |
| `src/hooks` | Shared TanStack Query hooks (`useOutcomes`, `useDirectoryUser`, `useDebounce`) |
| `src/types` | Shared TypeScript types |
| `scripts` | Migrations and seeds (plain Node, CommonJS) |

### Rules

- **Repository pattern:** SQL lives only in `*Repository.ts`, which maps snake\_case rows to camelCase types. Routes validate and call the repository; they never build SQL.
- **Server vs client:** a `'use client'` component never imports a repository or `pg`, even indirectly; that pulls `pg` into the browser bundle and breaks the build. Import the `*Api.ts` function instead.
- **Validation three times:** UI, API route, database constraint. The route is the real check; the UI only helps.
- **Route params are Promises** in Next 15 and 16: `const { id } = await params`.
- **Hooks:** `useSession` only inside `SessionProvider` (in `Providers.tsx`); no hooks in `layout.tsx`. Server components use `getServerSession(authOptions)`.
- **Query keys:** feature-scoped arrays, such as `['lookup-outcomes']`, `['admin-outcomes']`, `['team-weekly-stats', teamId]`, `['meeting-community-tags']`. After a write, invalidate the key that feeds the dropdown or list.
- **Errors:** routes return `{ error, message }` with 400 (bad input), 401, 403 (not yours), 404, 409 (duplicate), 502 (upstream down).
- **Canvas libraries** (the network graph) load with `next/dynamic` and `ssr: false`.
- **Bootstrap JS** is loaded once from the bundle; offcanvas links close the panel with `data-bs-dismiss`.

## Build and deployment

A push to `main` makes GitLab CI log in to OpenShift, apply the manifests, build the Dockerfile inside OpenShift and roll out the new image. Secrets and config maps are created by hand, once, and the pipeline never touches them.

### Pieces

| File | Purpose |
| --- | --- |
| `Dockerfile` | Multi-stage build of `.next/standalone`; runs under OpenShift's arbitrary UID |
| `next.config.*` | Must set `output: 'standalone'` or the Docker COPY step fails |
| `.gitlab-ci.yml` | `oc apply`, `oc start-build`, then `oc set image` (a `Deployment` has no image trigger) |
| `openshift/*.yaml` | ImageStream, BuildConfig, Deployment (`envFrom` the secret and config map), Service, Route |

CI variables (GitLab: Settings, CI/CD, Variables): `OPENSHIFT_SERVER`, `OPENSHIFT_TOKEN` (a `gitlab-ci` service account token with `edit`, masked; it expires, so reissue it), `OPENSHIFT_NAMESPACE`.

`NEXT_PUBLIC_*` values go in as Docker `ARG`s via the BuildConfig's `buildArgs`. Keep `replicas: 1` or more: scaling to zero caused slow cold starts.

### Certificates

Keycloak, the directory and the live service use the corporate CA. Mount the PEM bundle and point `NODE_EXTRA_CA_CERTS` at its absolute path. Test from inside a pod with `curl -v https://<host>/…`; a certificate error there will become a 502 or an `OAuthSignin` error in the app.

### Release checklist

- [ ] Env vars set: `LIVE_CONTACTS_API_URL`, `ADMIN_GROUP`, Keycloak trio, stable `NEXTAUTH_SECRET`
- [ ] `curl` the live service from a pod: no certificate error
- [ ] Migrations run (`migrate-contact-ids.js` dry run checked, then `--apply`) and seeds loaded once
- [ ] Session callback does not copy `accessToken`
- [ ] **Show all claims** shows the expected `groups` value
- [ ] Smoke test: `/api/contacts/organisations` returns `{id, name}`
- [ ] Search by name, then with an organisation; a broad search shows the refine notice
- [ ] Contact detail: name not doubled, role filled in
- [ ] Add a note, meeting and document to a contact such as `smithD_10`, then reload
- [ ] Leave a tab 10 minutes, then search again (token refresh)
- [ ] `/admin` works for an admin and is refused for a non-admin

## Troubleshooting

Every problem below has happened at least once on this project. Find the symptom, then check the cause first.

| Symptom | Cause | Fix |
| --- | --- | --- |
| `OAuthSignin` error at login | `KEYCLOAK_ISSUER` set to the authorization endpoint | Use the realm's `issuer` value |
| "Unable to verify certificate" or untrusted cert | Corporate CA not trusted by Node | `NODE_EXTRA_CA_CERTS` with an absolute path; never disable TLS checks |
| `/api/contacts` returns 401 | No Keycloak token (dev or bypass login), or the service rejected it | Sign in with Keycloak; log says "No Keycloak access token" or "refused the token" |
| `/api/contacts` returns 502 | Live service unreachable or its certificate is untrusted | Check `LIVE_CONTACTS_API_URL`; `curl` from a pod |
| Random logouts with two tabs open | Keycloak "Revoke Refresh Token" rotation | Check the realm setting; add `refetchInterval` |
| "searchContacts() was called on the server" | Server page using the client function | Import from `liveContactsServer` |
| Organisation dropdown empty, no error | Server-side error swallowed by `catch {}` | Log the error; use `getLiveOrganisations()` |
| `Organisation is not assignable to type string` | Old `string[]` type for organisations | Use `Organisation[]`; option value `o.id`, label `o.name` |
| Build pulls `pg` into the client | A client component imports a repository | Import the `*Api.ts` function |
| `TypeError: Failed to parse URL` | Relative fetch on the server | Call the repository directly, or use the internal URL |
| Meeting date shows a day early | `toISOString()` on a `DATE` in BST | `toDateOnly()` |
| Outcome not shown, edit dropdown empty, update saves null | Column missing from a SELECT or mapper, a mis-cased key (`outcome_Id`), or the patch payload not carrying it | Follow the round trip in the Links reference: DB, SELECT, mapper, type, JSON, view, edit state, payload, route, UPDATE |
| CORS error from a client hook | Calling another host from the browser | Go through a same-origin proxy route |
| 400 from an admin route | A typo in the path, caught by the dynamic `[kind]` route | Check the exact URL |
| "Expected 3–4 arguments, but got 5" on upload | `api.ts` `uploadDocument` signature not updated | Apply the `api.ts` patch from the feature note |
| `useSession` must be wrapped in `SessionProvider` | Hook used outside `Providers.tsx`, or in `layout.tsx` | Move it into a client component under the provider |
| Turbopack warning about `export const config` | Pages Router `bodyParser` setting in an App Router route | Delete it; it never had any effect |
| Slow pages on OpenShift | Cold starts, pool warm-up, external Route instead of internal DNS, missing indexes | Keep replicas at 1 or more; call internally; add indexes |
| Port already in use locally | An old dev server | `lsof -ti:3000 \| xargs kill -9` |

## Open items

Production launch is planned for the end of the week of 26 October 2026, with a list of enhancements running into 2027. These are the loose ends known at handover.

### Finish for launch

- [ ] Swap `isValidUuid(contactId)` for `isValidContactId` in routes outside the live-contacts package (POCs, tags, areas, headlines, highlight notes, community contacts, network)
- [ ] Point server code at `liveContactsServer` everywhere, including `/api/network` (it still resolves contact names through the old contacts API)
- [ ] Use `toDateOnly()` in the minister meetings, community calendar and team stats repositories
- [ ] Confirm the production `groups` claim, then remove the `admin` role fallback
- [ ] Hide `createdAt` on the contact detail page (the live service doesn't provide it)

### Waiting on the client

- [ ] Assessment step 3 option "Engagement pathway established" and a "Decision maker" contact tag (needed for engagement reporting)
- [ ] Whether "new decision-makers" means new to the organisation or new to a team
- [ ] Real document category names, then a one-off `UPDATE` of any rows saved as "Value 1" and so on
- [ ] Final names for the four meeting score categories (`SCORE_LABELS`)
- [ ] Wording check on the assessment options corrected from the original request

### Later

- Engagement reporting views (see the Engagement Reporting: Data Readiness doc)
- Document edit mode, so a document's outcome can be changed after upload
- Remove `MeetingGroupTagger`, `CommunitiesPanel` and `MeetingGroupsPanel` if confirmed unused
- Add a `/api/health` route for the OpenShift probes

### Gaps in this handbook

- Where the core tables (notes, meetings, links, POCs, tags, areas, teams, `user_teams`) are created is not recorded in the feature notes; add the original schema script to `scripts/` before launch.



# Contacts API (read-only, port 3001)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Notes API (this app's own routes, port 3000)
NEXT_PUBLIC_NOTES_API_URL=http://localhost:3000

NEXT_PUBLIC_PARLIAMENT_API_BASE_URL=http://localhost:3002

# Discovery Link
#NEXT_DISCOVERY_LINK=http://discovery.com/orm/

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=OxCtAs/kpG2e1QqGurmVFkZbxJ888WhgxQVRDGZq5b8=  # generate with: openssl rand -base64 32

# GitHub
GITHUB_CLIENT_ID=Ov23liXh4wXaue6SF7MK 
GITHUB_CLIENT_SECRET=65b6df82992176ca2a93a259efc7d33774b22e6d 


# Keycloak
KEYCLOAK_CLIENT_ID=your-client-id
KEYCLOAK_CLIENT_SECRET=your-client-secret
KEYCLOAK_ISSUER=https://your-keycloak-server/realms/your-realm

# Notes database (separate from contacts DB, same PostgreSQL server)
NOTES_DATABASE_URL="postgresql://db_access_1:db_connect_1@127.0.0.1:5432/opus_storm"
DATABASE_URL=postgres://postgres:SpongeBob55**@localhost:5432/parliament_members_api

# Discovery Basse NEXTAUTH_URL
NEXT_PUBLIC_OPENTEXT_BASE_URL ="http://arcnetmail.com?id="

# Or use individual variables instead of NOTES_DATABASE_URL:
 NOTES_PGHOST=localhost
 NOTES_PGPORT=5432
 NOTES_PGDATABASE=opus_storm
 NOTES_PGUSER=db_access_1
 NOTES_PGPASSWORD=db_connect_1

# SMTP relay
SMTP_HOST=smtp.company.com
SMTP_PORT=25
SMTP_SECURE=false
SMTP_FROM="Contacts App <noreply@company.com>"
# Only if the relay requires auth:
# SMTP_USER=...
# SMTP_PASSWORD=...

# Email derivation: username@EMAIL_DOMAIN
EMAIL_DOMAIN=company.com


DIRECTORY_API_BASE_URL=https://<host>:8443/rest/v3
# Only if the service needs it:
# DIRECTORY_API_TOKEN=...

ADMIN_GROUP=admin

