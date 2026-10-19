import { toDateOnly } from './dateOnly';
import { notesQuery } from './notesDb';
import type {
  CommunityCardData, CommunityDetail, CommunityPoc,
  CommunityNote, CommunityHeadline, CommunityMeeting,
} from '@/types/communityPages';

// ---------------------------------------------------------------------------
// Permission helpers
// ---------------------------------------------------------------------------

export async function isCommunityMember(communityId: string, username: string): Promise<boolean> {
  const rows = await notesQuery<{ member_id: string }>(
    `SELECT member_id FROM community_members WHERE community_id = $1 AND username = $2`,
    [communityId, username]
  );
  return rows.length > 0;
}

export async function isCommunityCreator(communityId: string, username: string): Promise<boolean> {
  const rows = await notesQuery<{ community_id: string }>(
    `SELECT community_id FROM communities WHERE community_id = $1 AND created_by = $2`,
    [communityId, username]
  );
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Listing + detail
// ---------------------------------------------------------------------------

interface CardRow {
  community_id: string; name: string; description: string; created_by: string;
  created_at: Date; member_count: string; is_member: boolean;
}

function toCard(r: CardRow, username: string): CommunityCardData {
  return {
    communityId: r.community_id,
    name: r.name,
    description: r.description,
    createdBy: r.created_by,
    createdAt: r.created_at.toISOString(),
    memberCount: parseInt(r.member_count, 10),
    isCreator: r.created_by === username,
    isMember: r.is_member,
  };
}

// ALL communities — user's own first, then the rest alphabetically
export async function getAllCommunities(username: string): Promise<CommunityCardData[]> {
  const rows = await notesQuery<CardRow>(
    `SELECT c.community_id, c.name, c.description, c.created_by, c.created_at,
            (SELECT COUNT(*)::text FROM community_members m WHERE m.community_id = c.community_id) AS member_count,
            EXISTS (SELECT 1 FROM community_members m
                    WHERE m.community_id = c.community_id AND m.username = $1) AS is_member
     FROM communities c
     ORDER BY (c.created_by = $1) DESC, c.name ASC`,
    [username]
  );
  return rows.map((r) => toCard(r, username));
}

export async function getCommunityDetail(
  communityId: string, username: string
): Promise<CommunityDetail | null> {
  const rows = await notesQuery<CardRow & { group_id: string | null; group_name: string | null }>(
    `SELECT c.community_id, c.name, c.description, c.created_by, c.created_at,
            (SELECT COUNT(*)::text FROM community_members m WHERE m.community_id = c.community_id) AS member_count,
            EXISTS (SELECT 1 FROM community_members m
                    WHERE m.community_id = c.community_id AND m.username = $2) AS is_member,
            g.group_id, g.name AS group_name
     FROM communities c
     LEFT JOIN meeting_groups g ON g.community_id = c.community_id
     WHERE c.community_id = $1`,
    [communityId, username]
  );
  if (!rows.length) return null;
  return { ...toCard(rows[0], username), groupId: rows[0].group_id, groupName: rows[0].group_name };
}

// Create a community AND its email group in one go; creator becomes a
// member of the community and admin of the group.
export async function createCommunityWithGroup(
  name: string, description: string, createdBy: string
): Promise<CommunityDetail> {
  const c = (await notesQuery<{ community_id: string }>(
    `INSERT INTO communities (name, description, created_by)
     VALUES ($1, $2, $3) RETURNING community_id`,
    [name, description, createdBy]
  ))[0];

  await notesQuery(
    `INSERT INTO community_members (community_id, username) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [c.community_id, createdBy]
  );

  const g = (await notesQuery<{ group_id: string }>(
    `INSERT INTO meeting_groups (name, created_by, community_id)
     VALUES ($1, $2, $3) RETURNING group_id`,
    [name, createdBy, c.community_id]
  ))[0];

  await notesQuery(
    `INSERT INTO meeting_group_members (group_id, username, role)
     VALUES ($1, $2, 'admin') ON CONFLICT DO NOTHING`,
    [g.group_id, createdBy]
  );

  return (await getCommunityDetail(c.community_id, createdBy))!;
}

// ---------------------------------------------------------------------------
// PoC
// ---------------------------------------------------------------------------

export async function getCommunityPocs(communityId: string): Promise<CommunityPoc[]> {
  const rows = await notesQuery<{ poc_id: string; community_id: string; username: string; created_at: Date }>(
    `SELECT poc_id, community_id, username, created_at FROM community_poc
     WHERE community_id = $1 ORDER BY created_at ASC`,
    [communityId]
  );
  return rows.map((r) => ({
    pocId: r.poc_id, communityId: r.community_id, username: r.username,
    createdAt: r.created_at.toISOString(),
  }));
}

export async function addCommunityPoc(communityId: string, username: string): Promise<boolean> {
  const rows = await notesQuery<{ poc_id: string }>(
    `INSERT INTO community_poc (community_id, username) VALUES ($1, $2)
     ON CONFLICT DO NOTHING RETURNING poc_id`,
    [communityId, username]
  );
  return rows.length > 0;
}

export async function removeCommunityPoc(communityId: string, username: string): Promise<boolean> {
  const rows = await notesQuery<{ poc_id: string }>(
    `DELETE FROM community_poc WHERE community_id = $1 AND username = $2 RETURNING poc_id`,
    [communityId, username]
  );
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Private notes (one per user per community, author-only visibility)
// ---------------------------------------------------------------------------

interface NoteRow {
  note_id: string; community_id: string; username: string; comment: string;
  created_at: Date; updated_at: Date;
}
const toNote = (r: NoteRow): CommunityNote => ({
  noteId: r.note_id, communityId: r.community_id, username: r.username,
  comment: r.comment, createdAt: r.created_at.toISOString(), updatedAt: r.updated_at.toISOString(),
});

export async function getMyCommunityNote(communityId: string, username: string): Promise<CommunityNote | null> {
  const rows = await notesQuery<NoteRow>(
    `SELECT note_id, community_id, username, comment, created_at, updated_at
     FROM community_notes WHERE community_id = $1 AND username = $2`,
    [communityId, username]
  );
  return rows.length ? toNote(rows[0]) : null;
}

export async function createCommunityNote(
  communityId: string, username: string, comment: string
): Promise<CommunityNote | null> {
  const rows = await notesQuery<NoteRow>(
    `INSERT INTO community_notes (community_id, username, comment) VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING
     RETURNING note_id, community_id, username, comment, created_at, updated_at`,
    [communityId, username, comment]
  );
  return rows.length ? toNote(rows[0]) : null;   // null = already has one
}

export async function updateCommunityNote(
  noteId: string, username: string, comment: string
): Promise<CommunityNote | null> {
  const rows = await notesQuery<NoteRow>(
    `UPDATE community_notes SET comment = $1 WHERE note_id = $2 AND username = $3
     RETURNING note_id, community_id, username, comment, created_at, updated_at`,
    [comment, noteId, username]
  );
  return rows.length ? toNote(rows[0]) : null;
}

export async function deleteCommunityNote(noteId: string, username: string): Promise<boolean> {
  const rows = await notesQuery<{ note_id: string }>(
    `DELETE FROM community_notes WHERE note_id = $1 AND username = $2 RETURNING note_id`,
    [noteId, username]
  );
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Headlines (shared, visible to all; author edits/deletes own)
// ---------------------------------------------------------------------------

interface HeadlineRow {
  headline_id: string; community_id: string; username: string; title: string; body: string;
  created_at: Date; updated_at: Date;
}
const toHeadline = (r: HeadlineRow): CommunityHeadline => ({
  headlineId: r.headline_id, communityId: r.community_id, username: r.username,
  title: r.title, body: r.body,
  createdAt: r.created_at.toISOString(), updatedAt: r.updated_at.toISOString(),
});

export async function getCommunityHeadlines(communityId: string): Promise<CommunityHeadline[]> {
  const rows = await notesQuery<HeadlineRow>(
    `SELECT headline_id, community_id, username, title, body, created_at, updated_at
     FROM community_headlines WHERE community_id = $1 ORDER BY created_at DESC`,
    [communityId]
  );
  return rows.map(toHeadline);
}

export async function createCommunityHeadline(
  communityId: string, username: string, title: string, body: string
): Promise<CommunityHeadline> {
  const rows = await notesQuery<HeadlineRow>(
    `INSERT INTO community_headlines (community_id, username, title, body)
     VALUES ($1, $2, $3, $4)
     RETURNING headline_id, community_id, username, title, body, created_at, updated_at`,
    [communityId, username, title, body]
  );
  return toHeadline(rows[0]);
}

export async function updateCommunityHeadline(
  headlineId: string, username: string, title: string, body: string
): Promise<CommunityHeadline | null> {
  const rows = await notesQuery<HeadlineRow>(
    `UPDATE community_headlines SET title = $1, body = $2
     WHERE headline_id = $3 AND username = $4
     RETURNING headline_id, community_id, username, title, body, created_at, updated_at`,
    [title, body, headlineId, username]
  );
  return rows.length ? toHeadline(rows[0]) : null;
}

export async function deleteCommunityHeadline(headlineId: string, username: string): Promise<boolean> {
  const rows = await notesQuery<{ headline_id: string }>(
    `DELETE FROM community_headlines WHERE headline_id = $1 AND username = $2 RETURNING headline_id`,
    [headlineId, username]
  );
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Meetings tagged with this community (for the calendar)
// ---------------------------------------------------------------------------

export async function getCommunityMeetings(communityId: string): Promise<CommunityMeeting[]> {
  const rows = await notesQuery<{
    meeting_id: string; contact_id: string; meeting_date: Date; title: string | null; username: string;
  }>(
    `SELECT m.meeting_id, m.contact_id, m.meeting_date, m.title, m.username
     FROM community_meeting_tags t
     JOIN contact_meetings m ON m.meeting_id = t.meeting_id
     WHERE t.community_id = $1
     ORDER BY m.meeting_date ASC`,
    [communityId]
  );
  return rows.map((r) => ({
    meetingId: r.meeting_id,
    contactId: r.contact_id,
    //meetingDate: r.meeting_date.toISOString().split('T')[0],
    meetingDate: toDateOnly(r.meeting_date),
    title: r.title ?? '',
    username: r.username,
  }));
}

// ---------------------------------------------------------------------------
// Email group members for a community (for auto-notify on meeting tag)
// ---------------------------------------------------------------------------

export async function getCommunityGroupMembers(
  communityId: string
): Promise<{ groupName: string; usernames: string[] } | null> {
  const rows = await notesQuery<{ name: string; username: string }>(
    `SELECT g.name, gm.username
     FROM meeting_groups g
     JOIN meeting_group_members gm ON gm.group_id = g.group_id
     WHERE g.community_id = $1`,
    [communityId]
  );
  if (!rows.length) return null;
  return { groupName: rows[0].name, usernames: rows.map((r) => r.username) };
}
