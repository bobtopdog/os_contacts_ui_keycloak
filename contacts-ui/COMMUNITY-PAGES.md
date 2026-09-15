# Community Pages Restructure — Integration Guide

## What changes for users

| Before | After |
|---|---|
| Communities managed in the profile offcanvas | `/communities` page — your own first, then all others, as cards |
| `/communities/[id]` listed tagged contacts only | Full homepage: PoC, Headlines, private note, calendar, tagged contacts, members, email group |
| Email groups managed in their own offcanvas | Each community owns exactly ONE email group, auto-created with it, managed on the community page |
| Meeting form: community dropdown + mailing group dropdown | One community dropdown — its email group is notified automatically |

## Files

| File | Action |
|---|---|
| `scripts/migrate-community-pages.js` | New — **DESTRUCTIVE**: deletes all existing meeting groups (per "start fresh") |
| `src/types/communityPages.ts` | New |
| `src/libs/communityPagesRepository.ts` | New — all homepage data + createCommunityWithGroup |
| `src/libs/communityPagesApi.ts` | New — client functions |
| `src/libs/communityNotify.ts` | New — emails the linked group when a meeting is tagged |
| `src/app/api/communities/all/route.ts` | New |
| `src/app/api/communities/[communityId]/detail/route.ts` | New |
| `src/app/api/communities/[communityId]/poc/route.ts` | New |
| `src/app/api/communities/[communityId]/notes/route.ts` | New |
| `src/app/api/communities/notes/[noteId]/route.ts` | New |
| `src/app/api/communities/[communityId]/headlines/route.ts` | New |
| `src/app/api/communities/headlines/[headlineId]/route.ts` | New |
| `src/app/api/communities/[communityId]/meetings/route.ts` | New |
| `src/components/community/*.tsx` | New — 7 homepage components |
| `src/app/communities/page.tsx` | New — the listing |
| `src/app/communities/[communityId]/page.tsx` | REPLACE — was the tagged-contacts list, now the homepage |
| `src/components/MeetingTagSelectors.tsx` | REPLACE — single community dropdown; prop `selectedGroupId`/`onGroupChange` removed |
| `PATCH-community-pages.ts` | Two small edits to existing routes (create group; notify group) |

## Steps

1. **Back up**, then run the migration:

       "db:migrate:community-pages": "node scripts/migrate-community-pages.js"
       npm run db:migrate:community-pages

2. Copy in all new files; replace the two REPLACE files.
3. Apply the two patches in `PATCH-community-pages.ts`.
4. In your `AddMeetingForm` (ContactMeetings.tsx): remove the `groupId`
   state and the `onGroupChange`/`selectedGroupId` props from
   `<MeetingTagSelectors>`, and delete the `tagMeetingWithGroup(...)` call —
   the community tag alone now triggers the emails.
5. Remove the old offcanvas wiring:
   - Delete the `#communitiesOffcanvas` and `#meetingGroupsOffcanvas` blocks
     from your layout and their trigger buttons in the Navbar.
   - `CommunitiesPanel.tsx`, `MeetingGroupsPanel.tsx` and
     `MeetingGroupTagger.tsx` are no longer used — delete them (or leave
     until you're confident; they don't break anything).
   - The `/api/meeting-groups` create/rename/delete/duplicate routes are now
     unreachable from the UI but harmless; the member/role/CSV routes are
     still used by `CommunityEmailGroup`.
6. Add a Navbar link: `<Link href="/communities">🏘️ Communities</Link>`

## Permission model

| Action | Who |
|---|---|
| View any community homepage | everyone |
| Read headlines, PoC list, calendar, tagged contacts | everyone |
| Mark self as PoC / add headline / add private note | community members |
| Edit or delete a headline / private note | its author |
| Add/remove community members | community owner |
| Add/remove email-group members | email-group admins (owner is admin by default) |
| Grant/revoke email-group admin | community owner |

All enforced server-side via `isCommunityMember` / `isCommunityCreator`,
not just hidden in the UI.

## Design notes

- **Private notes are truly private** — `GET .../notes?username=` returns only
  the caller's own note. If you'd rather they behave like contact notes
  (everyone sees all, "you" badge on your own), swap `getMyCommunityNote`
  for a list query — the one-per-user rule stays either way.
- **Headlines** = shared bulletin: title + optional body, newest first,
  readable by everyone, added by members, author-editable.
- **Calendar** is a self-contained Monday-first month grid (no library).
  Days with meetings show a count badge; click a day to list them, each
  linking to the contact. Data comes from the existing
  `community_meeting_tags` join, so every past tag already appears.
- **Email group auto-creation** happens in one repository call —
  community → creator as member → group (same name, `community_id`) →
  creator as group admin. Group membership is managed separately from
  community membership, per the spec ("the owner can then add members").
- **Notification on tag** uses a self-contained nodemailer helper
  (`communityNotify.ts`) reading the same SMTP env vars as `email.ts`. Swap
  its `send()` for your existing helper if you'd prefer a single path.
- The `/communities/[id]/contacts` API route from before is reused unchanged
  by `CommunityTaggedContacts`.
