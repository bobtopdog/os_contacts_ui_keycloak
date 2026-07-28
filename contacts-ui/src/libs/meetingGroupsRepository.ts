import { notesQuery } from './notesDb';
import type { MeetingGroup, MeetingGroupMember, MeetingGroupTag, GroupRole } from '@/types/meetingGroup';

interface GroupRow {
  group_id: string;
  name: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  member_count: string;
  my_role: GroupRole;
}

interface MemberRow {
  group_member_id: string;
  group_id: string;
  username: string;
  role: GroupRole;
  added_at: Date;
}

interface TagRow {
  tag_id: string;
  group_id: string;
  group_name: string;
  meeting_id: string;
  tagged_by: string;
  created_at: Date;
}

function toMember(row: MemberRow): MeetingGroupMember {
  return {
    groupMemberId: row.group_member_id,
    groupId: row.group_id,
    username: row.username,
    role: row.role,
    addedAt: row.added_at.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Access helpers
// ---------------------------------------------------------------------------

export async function isGroupAdmin(groupId: string, username: string): Promise<boolean> {
  const rows = await notesQuery<{ group_member_id: string }>(
    `SELECT group_member_id FROM meeting_group_members
     WHERE group_id = $1 AND username = $2 AND role = 'admin'`,
    [groupId, username]
  );
  return rows.length > 0;
}

export async function isGroupCreator(groupId: string, username: string): Promise<boolean> {
  const rows = await notesQuery<{ group_id: string }>(
    `SELECT group_id FROM meeting_groups
     WHERE group_id = $1 AND created_by = $2`,
    [groupId, username]
  );
  return rows.length > 0;
}

export async function isGroupMember(groupId: string, username: string): Promise<boolean> {
  const rows = await notesQuery<{ group_member_id: string }>(
    `SELECT group_member_id FROM meeting_group_members
     WHERE group_id = $1 AND username = $2`,
    [groupId, username]
  );
  return rows.length > 0;
}

export async function getGroupAdminUsernames(groupId: string): Promise<string[]> {
  const rows = await notesQuery<{ username: string }>(
    `SELECT username FROM meeting_group_members
     WHERE group_id = $1 AND role = 'admin'`,
    [groupId]
  );
  return rows.map((r) => r.username);
}

export async function getGroupMemberUsernames(groupId: string): Promise<string[]> {
  const rows = await notesQuery<{ username: string }>(
    `SELECT username FROM meeting_group_members WHERE group_id = $1`,
    [groupId]
  );
  return rows.map((r) => r.username);
}

export async function getGroupName(groupId: string): Promise<string> {
  const rows = await notesQuery<{ name: string }>(
    `SELECT name FROM meeting_groups WHERE group_id = $1`,
    [groupId]
  );
  return rows[0]?.name ?? 'Unknown group';
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export async function getUserGroups(username: string): Promise<MeetingGroup[]> {
  const rows = await notesQuery<GroupRow>(
    `SELECT g.group_id, g.name, g.created_by, g.created_at, g.updated_at,
            (SELECT COUNT(*)::text FROM meeting_group_members
             WHERE group_id = g.group_id) AS member_count,
            m.role AS my_role
     FROM meeting_groups g
     JOIN meeting_group_members m
       ON m.group_id = g.group_id AND m.username = $1
     ORDER BY g.name ASC`,
    [username]
  );

  return rows.map((r) => ({
    groupId: r.group_id,
    name: r.name,
    createdBy: r.created_by,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
    memberCount: parseInt(r.member_count, 10),
    isCreator: r.created_by === username,
    myRole: r.my_role,
  }));
}

export async function createGroup(name: string, createdBy: string): Promise<MeetingGroup> {
  const rows = await notesQuery<{ group_id: string; name: string; created_by: string; created_at: Date; updated_at: Date  }>(
    `INSERT INTO meeting_groups (name, created_by)
     VALUES ($1, $2)
     RETURNING group_id, name, created_by, created_at`,
    [name, createdBy]
  );
  const g = rows[0];

  // Creator is automatically an admin member
  await notesQuery(
    `INSERT INTO meeting_group_members (group_id, username, role)
     VALUES ($1, $2, 'admin')
     ON CONFLICT DO NOTHING`,
    [g.group_id, createdBy]
  );

  return {
    groupId: g.group_id,
    name: g.name,
    createdBy: g.created_by,
    createdAt: g.created_at.toISOString(),
    updatedAt: g.updated_at.toISOString(),
    memberCount: 1,
    isCreator: true,
    myRole: 'admin',
  };
}

// Rename — admins only (enforced by caller check + here defensively)
export async function renameGroup(
  groupId: string,
  username: string,
  newName: string
): Promise<boolean> {
  if (!(await isGroupAdmin(groupId, username))) return false;
  const rows = await notesQuery<{ group_id: string }>(
    `UPDATE meeting_groups SET name = $1
     WHERE group_id = $2
     RETURNING group_id`,
    [newName, groupId]
  );
  return rows.length > 0;
}

// Delete — creator only
export async function deleteGroup(groupId: string, username: string): Promise<boolean> {
  const rows = await notesQuery<{ group_id: string }>(
    `DELETE FROM meeting_groups
     WHERE group_id = $1 AND created_by = $2
     RETURNING group_id`,
    [groupId, username]
  );
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

export async function getGroupMembers(groupId: string): Promise<MeetingGroupMember[]> {
  const rows = await notesQuery<MemberRow>(
    `SELECT group_member_id, group_id, username, role, added_at
     FROM meeting_group_members
     WHERE group_id = $1
     ORDER BY role ASC, username ASC`, // admins first ('admin' < 'viewer')
    [groupId]
  );
  return rows.map(toMember);
}

// Add member — requesting user must be an admin
export async function addGroupMember(
  groupId: string,
  requestingUser: string,
  newUsername: string,
  role: GroupRole
): Promise<MeetingGroupMember | null> {
  if (!(await isGroupAdmin(groupId, requestingUser))) return null;

  const rows = await notesQuery<MemberRow>(
    `INSERT INTO meeting_group_members (group_id, username, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (group_id, username) DO NOTHING
     RETURNING group_member_id, group_id, username, role, added_at`,
    [groupId, newUsername, role]
  );
  return rows.length ? toMember(rows[0]) : null;
}

// Remove member — requesting user must be an admin; creator cannot be removed
export async function removeGroupMember(
  groupId: string,
  groupMemberId: string,
  requestingUser: string
): Promise<{ removed: boolean; removedUsername?: string }> {
  if (!(await isGroupAdmin(groupId, requestingUser))) return { removed: false };

  const rows = await notesQuery<{ group_member_id: string; username: string }>(
    `DELETE FROM meeting_group_members m
     USING meeting_groups g
     WHERE m.group_member_id = $1
       AND m.group_id = $2
       AND g.group_id = m.group_id
       AND m.username <> g.created_by
     RETURNING m.group_member_id, m.username`,
    [groupMemberId, groupId]
  );
  return rows.length
    ? { removed: true, removedUsername: rows[0].username }
    : { removed: false };
}

// Change a member's role — creator only; creator's own role cannot be changed
export async function setMemberRole(
  groupId: string,
  groupMemberId: string,
  requestingUser: string,
  role: GroupRole
): Promise<{ updated: boolean; username?: string }> {
  if (!(await isGroupCreator(groupId, requestingUser))) return { updated: false };

  const rows = await notesQuery<{ group_member_id: string; username: string }>(
    `UPDATE meeting_group_members m
     SET role = $1
     FROM meeting_groups g
     WHERE m.group_member_id = $2
       AND m.group_id = $3
       AND g.group_id = m.group_id
       AND m.username <> g.created_by
     RETURNING m.group_member_id, m.username`,
    [role, groupMemberId, groupId]
  );
  return rows.length
    ? { updated: true, username: rows[0].username }
    : { updated: false };
}

// ---------------------------------------------------------------------------
// Meeting tags
// ---------------------------------------------------------------------------

export async function getMeetingTags(meetingId: string): Promise<MeetingGroupTag[]> {
  const rows = await notesQuery<TagRow>(
    `SELECT t.tag_id, t.group_id, g.name AS group_name,
            t.meeting_id, t.tagged_by, t.created_at
     FROM meeting_group_tags t
     JOIN meeting_groups g ON g.group_id = t.group_id
     WHERE t.meeting_id = $1
     ORDER BY t.created_at DESC`,
    [meetingId]
  );
  return rows.map((r) => ({
    tagId: r.tag_id,
    groupId: r.group_id,
    groupName: r.group_name,
    meetingId: r.meeting_id,
    taggedBy: r.tagged_by,
    createdAt: r.created_at.toISOString(),
  }));
}

// Tag a meeting — tagger must be a member of the group
export async function tagMeeting(
  meetingId: string,
  groupId: string,
  taggedBy: string
): Promise<MeetingGroupTag | null> {
  if (!(await isGroupMember(groupId, taggedBy))) return null;

  const rows = await notesQuery<{ tag_id: string; created_at: Date }>(
    `INSERT INTO meeting_group_tags (meeting_id, group_id, tagged_by)
     VALUES ($1, $2, $3)
     RETURNING tag_id, created_at`,
    [meetingId, groupId, taggedBy]
  );
  const name = await getGroupName(groupId);

  return {
    tagId: rows[0].tag_id,
    groupId,
    groupName: name,
    meetingId,
    taggedBy,
    createdAt: rows[0].created_at.toISOString(),
  };
}

// Remove a tag — only the user who tagged it
export async function removeMeetingTag(tagId: string, username: string): Promise<boolean> {
  const rows = await notesQuery<{ tag_id: string }>(
    `DELETE FROM meeting_group_tags
     WHERE tag_id = $1 AND tagged_by = $2
     RETURNING tag_id`,
    [tagId, username]
  );
  return rows.length > 0;
}

// ===========================================================================
// ADD THIS FUNCTION to your existing src/libs/meetingGroupsRepository.ts
// ===========================================================================

// Duplicate a group and all its members. Any existing member can duplicate.
// The duplicator becomes the CREATOR (and admin) of the copy; all other
// members are copied across with their existing roles.
export async function duplicateMeetingGroup(
  groupId: string,
  requestingUser: string
): Promise<MeetingGroup | null> {
  // Requester must be a member of the source group
  const memberCheck = await notesQuery<{ member_id: string }>(
    `SELECT group_member_id FROM meeting_group_members
     WHERE group_id = $1 AND username = $2`,
    [groupId, requestingUser]
  );
  if (memberCheck.length === 0) return null;

  // Create the copy named "Copy of <original>"
  const groupRows = await notesQuery<{
    group_id: string; name: string; created_by: string;
    created_at: Date; updated_at: Date;
  }>(
    `INSERT INTO meeting_groups (name, created_by)
     SELECT 'Copy of ' || name, $2
     FROM meeting_groups WHERE group_id = $1
     RETURNING group_id, name, created_by, created_at, updated_at`,
    [groupId, requestingUser]
  );
  if (groupRows.length === 0) return null;
  const copy = groupRows[0];

  // Copy all members with their roles, but force the duplicator to admin.
  // ON CONFLICT guards the case where the duplicator was already a member
  // of the source (they will be — the upsert keeps one row, role admin).
  await notesQuery(
    `INSERT INTO meeting_group_members (group_id, username, role)
     SELECT $1, username, CASE WHEN username = $2 THEN 'admin' ELSE role END
     FROM meeting_group_members
     WHERE group_id = $3
     ON CONFLICT (group_id, username) DO NOTHING`,
    [copy.group_id, requestingUser, groupId]
  );

  const countRows = await notesQuery<{ count: string }>(
    `SELECT COUNT(*) AS count FROM meeting_group_members WHERE group_id = $1`,
    [copy.group_id]
  );

  return {
    groupId: copy.group_id,
    name: copy.name,
    createdBy: copy.created_by,
    createdAt: copy.created_at.toISOString(),
    updatedAt: copy.updated_at.toISOString(),
    memberCount: parseInt(countRows[0].count, 10),
    myRole: 'admin',
    isCreator: true,
  };
}

