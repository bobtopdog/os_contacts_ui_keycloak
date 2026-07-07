import { notesQuery } from './notesDb';
import type { Community, CommunityMember, CommunityTag } from '@/types/community';

interface CommunityRow {
  community_id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: Date;
  member_count: string;
}

interface MemberRow {
  member_id: string;
  community_id: string;
  username: string;
  added_at: Date;
}

interface TagRow {
  tag_id: string;
  community_id: string;
  community_name: string;
  contact_id: string;
  tagged_by: string;
  created_at: Date;
}

// ---------------------------------------------------------------------------
// Communities
// ---------------------------------------------------------------------------

// Returns all communities the user is a member of (or created)
export async function getUserCommunities(username: string): Promise<Community[]> {
  const rows = await notesQuery<CommunityRow>(
    `SELECT c.community_id, c.name, c.description, c.created_by, c.created_at,
            (SELECT COUNT(*)::text FROM community_members
             WHERE community_id = c.community_id) AS member_count
     FROM communities c
     WHERE c.community_id IN (
       SELECT community_id FROM community_members WHERE username = $1
     )
     ORDER BY c.name ASC`,
    [username]
  );

  return rows.map((r) => ({
    communityId: r.community_id,
    name: r.name,
    description: r.description,
    createdBy: r.created_by,
    createdAt: r.created_at.toISOString(),
    memberCount: parseInt(r.member_count, 10),
    isCreator: r.created_by === username,
  }));
}

export async function createCommunity(
  name: string,
  description: string,
  createdBy: string
): Promise<Community> {
  // Insert the community
  const communityRows = await notesQuery<CommunityRow>(
    `INSERT INTO communities (name, description, created_by)
     VALUES ($1, $2, $3)
     RETURNING community_id, name, description, created_by, created_at,
               '1' AS member_count`,
    [name, description, createdBy]
  );
  const c = communityRows[0];

  // Automatically add the creator as a member
  await notesQuery(
    `INSERT INTO community_members (community_id, username)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [c.community_id, createdBy]
  );

  return {
    communityId: c.community_id,
    name: c.name,
    description: c.description,
    createdBy: c.created_by,
    createdAt: c.created_at.toISOString(),
    memberCount: 1,
    isCreator: true,
  };
}

// Delete a community — only the creator can do this
export async function deleteCommunity(
  communityId: string,
  username: string
): Promise<boolean> {
  const rows = await notesQuery<{ community_id: string }>(
    `DELETE FROM communities
     WHERE community_id = $1 AND created_by = $2
     RETURNING community_id`,
    [communityId, username]
  );
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

export async function getCommunityMembers(communityId: string): Promise<CommunityMember[]> {
  const rows = await notesQuery<MemberRow>(
    `SELECT member_id, community_id, username, added_at
     FROM community_members
     WHERE community_id = $1
     ORDER BY added_at ASC`,
    [communityId]
  );
  return rows.map((r) => ({
    memberId: r.member_id,
    communityId: r.community_id,
    username: r.username,
    addedAt: r.added_at.toISOString(),
  }));
}

// Add member — only if requestingUser is the creator
export async function addCommunityMember(
  communityId: string,
  requestingUser: string,
  newMemberUsername: string
): Promise<CommunityMember | null> {
  // Verify the requesting user is the creator
  const creatorCheck = await notesQuery<{ community_id: string }>(
    `SELECT community_id FROM communities
     WHERE community_id = $1 AND created_by = $2`,
    [communityId, requestingUser]
  );
  if (creatorCheck.length === 0) return null;

  const rows = await notesQuery<MemberRow>(
    `INSERT INTO community_members (community_id, username)
     VALUES ($1, $2)
     ON CONFLICT (community_id, username) DO NOTHING
     RETURNING member_id, community_id, username, added_at`,
    [communityId, newMemberUsername]
  );
  if (rows.length === 0) return null;

  return {
    memberId: rows[0].member_id,
    communityId: rows[0].community_id,
    username: rows[0].username,
    addedAt: rows[0].added_at.toISOString(),
  };
}

// Remove member — only if requestingUser is the creator
// The creator cannot remove themselves
export async function removeCommunityMember(
  communityId: string,
  memberId: string,
  requestingUser: string
): Promise<boolean> {
  const rows = await notesQuery<{ member_id: string }>(
    `DELETE FROM community_members cm
     USING communities c
     WHERE cm.member_id = $1
       AND cm.community_id = $2
       AND c.community_id = cm.community_id
       AND c.created_by = $3
       AND cm.username <> c.created_by
     RETURNING cm.member_id`,
    [memberId, communityId, requestingUser]
  );
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Contact tags
// ---------------------------------------------------------------------------

export async function getContactTags(contactId: string): Promise<CommunityTag[]> {
  const rows = await notesQuery<TagRow>(
    `SELECT t.tag_id, t.community_id, c.name AS community_name,
            t.contact_id, t.tagged_by, t.created_at
     FROM community_contact_tags t
     JOIN communities c ON c.community_id = t.community_id
     WHERE t.contact_id = $1
     ORDER BY t.created_at DESC`,
    [contactId]
  );
  return rows.map((r) => ({
    tagId: r.tag_id,
    communityId: r.community_id,
    communityName: r.community_name,
    contactId: r.contact_id,
    taggedBy: r.tagged_by,
    createdAt: r.created_at.toISOString(),
  }));
}

// Add tag — verifies the user is a member of the community
export async function addContactTag(
  contactId: string,
  communityId: string,
  taggedBy: string
): Promise<CommunityTag | null> {
  // Verify membership
  const memberCheck = await notesQuery<{ member_id: string }>(
    `SELECT member_id FROM community_members
     WHERE community_id = $1 AND username = $2`,
    [communityId, taggedBy]
  );
  if (memberCheck.length === 0) return null;

  const rows = await notesQuery<TagRow>(
    `INSERT INTO community_contact_tags (contact_id, community_id, tagged_by)
     VALUES ($1, $2, $3)
     RETURNING tag_id, community_id, contact_id, tagged_by, created_at`,
    [contactId, communityId, taggedBy]
  );

  // Join back to get community name
  const nameRows = await notesQuery<{ name: string }>(
    `SELECT name FROM communities WHERE community_id = $1`,
    [communityId]
  );

  return {
    tagId: rows[0].tag_id,
    communityId: rows[0].community_id,
    communityName: nameRows[0].name,
    contactId: rows[0].contact_id,
    taggedBy: rows[0].tagged_by,
    createdAt: rows[0].created_at.toISOString(),
  };
}

// Remove a tag — only the user who tagged it can remove it
export async function removeContactTag(
  tagId: string,
  taggedBy: string
): Promise<boolean> {
  const rows = await notesQuery<{ tag_id: string }>(
    `DELETE FROM community_contact_tags
     WHERE tag_id = $1 AND tagged_by = $2
     RETURNING tag_id`,
    [tagId, taggedBy]
  );
  return rows.length > 0;
}

// Get all contact IDs tagged with a given community
export async function getContactIdsByCommunity(communityId: string): Promise<string[]> {
  const rows = await notesQuery<{ contact_id: string }>(
    `SELECT DISTINCT contact_id
     FROM community_contact_tags
     WHERE community_id = $1
     ORDER BY contact_id`,
    [communityId]
  );
  return rows.map((r) => r.contact_id);
}