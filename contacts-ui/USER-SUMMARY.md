# About Me + User Summary Modal — Integration

## Files

| File | Purpose |
|---|---|
| `scripts/migrate-user-profiles.js` | Creates `user_profiles` (username PK, about_me) |
| `src/types/userProfile.ts` | Types |
| `src/libs/userProfileRepository.ts` | About-me upsert + the summary aggregation |
| `src/libs/userProfileApi.ts` | Client functions |
| `src/app/api/users/[username]/about/route.ts` | GET / PUT about-me (PUT is session-verified: own profile only) |
| `src/app/api/users/[username]/summary/route.ts` | GET the modal payload |
| `src/components/AboutMeCard.tsx` | Profile editor |
| `src/components/UserSummaryLink.tsx` | Clickable username → modal |

## Steps

1. Migration:

       "db:migrate:user-profiles": "node scripts/migrate-user-profiles.js"
       npm run db:migrate:user-profiles

2. Profile page — in `ProfilePanel.tsx`, add the card (e.g. between
   ClaimsCard and TeamsSection):

       import AboutMeCard from '@/components/AboutMeCard';
       
       <AboutMeCard username={username} />

3. Teams page — in `TeamPage.tsx`, in the members table, replace the plain
   username cell content with:

       import UserSummaryLink from '@/components/UserSummaryLink';
       <UserSummaryLink username={member.username} />

   That's it — the component owns its own modal state.

## Behaviour

- **About me** is optional, max 2000 chars, with a live counter. Saving is
  verified against the SERVER session (getServerSession), not a body field
  — nobody can write someone else's bio by crafting a request.
- **Modal** shows: username, about-me (or a gentle "nothing yet"), PoC
  contacts as clickable badges, and the single most recent note / meeting /
  document — each shown only if it exists, with contact name + timestamp,
  linking to the contact.
- Pure React modal (no Bootstrap JS instance juggling): backdrop click,
  ✕, Close button and Escape all dismiss it. Uses Bootstrap's modal CSS
  classes so it looks identical to your other modals.
- Summary is cached for 60s per user; saving your about-me invalidates it.

## Reuse tip

`UserSummaryLink` works anywhere a username appears — note cards, meeting
cards, headline authors, community members. Swapping `{note.username}` for
`<UserSummaryLink username={note.username} />` gives every author a
profile popup with no further wiring.

## Extending the "recent activity" list

Adding e.g. latest minister meeting or latest link = one more LIMIT 1 query
in `getUserSummary`, one more field in the type, one more `<ActivityRow>`.
