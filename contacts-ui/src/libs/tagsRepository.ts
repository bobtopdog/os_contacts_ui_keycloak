import { notesQuery } from './notesDb';
import type { ContactTag } from '@/types/contact';

interface TagRow {
  tag_id: string;
  contact_id: string;
  username: string;
  tag: string;
  created_at: Date;
}

function toTag(row: TagRow): ContactTag {
  return {
    tagId: row.tag_id,
    contactId: row.contact_id,
    username: row.username,
    tag: row.tag,
    createdAt: row.created_at.toISOString(),
  };
}

export async function getTagByContactId(contactId: string): Promise<ContactTag[]> {
  const rows = await notesQuery<TagRow>(
    `SELECT tag_id, contact_id, username, tag, created_at
     FROM contact_tag
     WHERE contact_id = $1
     ORDER BY created_at DESC`,
    [contactId]
  );
  return rows.map(toTag);
}


export async function createTag(
  contactId: string,
  username: string,
  tag: string
): Promise<ContactTag> {
  const rows = await notesQuery<TagRow>(
    `INSERT INTO contact_tag (contact_id, username, tag)
     VALUES ($1, $2, $3)
     RETURNING tag_id, contact_id, username, tag, created_at`,
    [contactId, username, tag]
  );
  return toTag(rows[0]);
}

// Delete a tag — only if the username matches (owner check at DB level)
export async function deleteTag(
  tagId: string,
  username: string
): Promise<boolean> {
  const rows = await notesQuery<{ tag_id: string }>(
    `DELETE FROM contact_tag
     WHERE tag_id = $1 AND username = $2
     RETURNING tag_id`,
    [tagId, username]
  );
  return rows.length > 0;
}

/**
 * Returns all contact_ids for the tag
 */
export async function getTagContactIds(tag: string): Promise<string[]> {
  const rows = await notesQuery<TagRow>(
    `SELECT contact_id
     FROM contact_tag
     WHERE tag = $1
     ORDER BY created_at DESC`,
    [tag]
  );
  return rows.map((r) => r.contact_id);
}