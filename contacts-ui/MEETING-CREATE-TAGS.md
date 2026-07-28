# Meeting Creation Tags (Community + Mailing Group) — Integration Guide

## What this adds

Two optional dropdowns on the create-meeting form:
- 🏘️ **Community** — communities the user belongs to (no emails sent)
- 👥 **Mailing group** — meeting groups the user belongs to (members are
  emailed, reusing the existing group-tag notification)

Plus community tag badges on meeting cards (green, alongside the existing
group tag badges).

## Setup

1. Run the migration (creates `community_meeting_tags`):

       "db:migrate:community-meeting-tags": "node scripts/migrate-community-meeting-tags.js"
       npm run db:migrate:community-meeting-tags

2. Paste `PATCH-communitiesRepository-meeting-tags.ts` into
   `src/libs/communitiesRepository.ts` (includes the `MeetingCommunityTag`
   type addition for `src/types/community.ts` at the bottom of the file).

3. Paste `PATCH-communitiesApi-meeting-tags.ts` into
   `src/libs/communitiesApi.ts`.

4. Copy in the API routes and the two new components.

## Wiring into your AddMeetingForm (in ContactMeetings.tsx)

Add imports:

    import MeetingTagSelectors from '@/components/MeetingTagSelectors';
    import { tagMeetingWithCommunity } from '@/libs/communitiesApi';
    import { tagMeetingWithGroup } from '@/libs/meetingGroupsApi';

Add state next to your other form state:

    const [communityId, setCommunityId] = useState('');
    const [groupId, setGroupId] = useState('');

Render the selectors anywhere in the form (e.g. between comments and the
save button):

    <MeetingTagSelectors
      selectedCommunityId={communityId}
      selectedGroupId={groupId}
      onCommunityChange={setCommunityId}
      onGroupChange={setGroupId}
      disabled={isSaving}
    />

Then in your save handler, after the meeting is created, apply the tags
(the postMeeting response contains the new meetingId):

    const meeting = await postMeeting({ ... });

    // Optional tags — failures shouldn't block the meeting save
    const tagJobs: Promise<unknown>[] = [];
    if (communityId) {
      tagJobs.push(tagMeetingWithCommunity({
        meetingId: meeting.meetingId, communityId, taggedBy: username,
      }));
    }
    if (groupId) {
      tagJobs.push(tagMeetingWithGroup({
        meetingId: meeting.meetingId, groupId, taggedBy: username,
      }));
    }
    await Promise.allSettled(tagJobs);

    setCommunityId('');
    setGroupId('');

Don't forget to invalidate the tag queries if the card is already showing:

    queryClient.invalidateQueries({ queryKey: ['meeting-community-tags'] });
    queryClient.invalidateQueries({ queryKey: ['meeting-group-tags'] });

## Displaying community tags on meeting cards

In the MeetingCard view mode, next to your existing group tagger:

    import MeetingCommunityTags from '@/components/MeetingCommunityTags';

    <MeetingCommunityTags meetingId={meeting.meetingId} />

## Behaviour notes

- Dropdowns only appear if the user belongs to at least one community/group;
  users in neither see the form exactly as before.
- Tagging with a mailing group at creation time sends the same email
  notification as tagging afterwards via the tagger (one email per member).
- Communities do NOT trigger emails — they're organisational tags only.
- The UNIQUE constraints prevent double-tagging the same meeting with the
  same community or group.
- Membership is verified server-side: tagging with a community/group you're
  not in returns 403 regardless of what the UI shows.
