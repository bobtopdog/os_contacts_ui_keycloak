// ===========================================================================
// PATCH 1 — src/app/api/communities/route.ts  (POST handler)
// ===========================================================================
// Replace the import + the createCommunity call so a community's email group
// is created in the same request:
//
//   import { getUserCommunities } from '@/libs/communitiesRepository';
//   import { createCommunityWithGroup } from '@/libs/communityPagesRepository';
//
//   ...inside POST, replace:
//     const community = await createCommunity(name.trim(), description.trim(), username.trim());
//   with:
//     const community = await createCommunityWithGroup(name.trim(), description.trim(), username.trim());
//
// (The response shape is a superset of the old one, so the existing
// createCommunity client function keeps working unchanged.)


// ===========================================================================
// PATCH 2 — src/app/api/communities/meeting-tags/route.ts  (POST handler)
// ===========================================================================
// After the community tag is successfully created (i.e. just before the
// `return NextResponse.json({ data: tag }, { status: 201 })`), notify the
// community's email group. Add the imports:
//
//   import { notifyCommunityGroupOfMeeting } from '@/libs/communityNotify';
//   import { notesQuery } from '@/libs/notesDb';
//
// and insert this block (fire-and-forget — the response is not delayed):
//
//   const [meeting] = await notesQuery<{ meeting_date: Date; title: string | null; contact_id: string }>(
//     `SELECT meeting_date, title, contact_id FROM contact_meetings WHERE meeting_id = $1`,
//     [meetingId]
//   );
//   notifyCommunityGroupOfMeeting({
//     communityId,
//     communityName: tag.communityName,
//     meetingId,
//     meetingTitle: meeting?.title ?? '',
//     meetingDate: meeting ? meeting.meeting_date.toISOString().split('T')[0] : '',
//     taggedBy,
//     contactId: meeting?.contact_id ?? '',
//   });
//
// Note: `tag.communityName` assumes your community tag object includes the
// community name (it did in the version I delivered). If yours only carries
// communityId, look the name up with a one-line SELECT on communities.
