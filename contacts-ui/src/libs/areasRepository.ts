import { notesQuery } from './notesDb';
import type { ContactArea } from '@/types/contact';

interface AreaRow {
  area_id: string;
  contact_id: string;
  username: string;
  area: string;
  created_at: Date;
}

function toArea(row: AreaRow): ContactArea {
  return {
    areaId: row.area_id,
    contactId: row.contact_id,
    username: row.username,
    area: row.area,
    createdAt: row.created_at.toISOString(),
  };
}

export async function getAreaByContactId(contactId: string): Promise<ContactArea[]> {
  const rows = await notesQuery<AreaRow>(
    `SELECT area_id, contact_id, username, area, created_at
     FROM contact_areas
     WHERE contact_id = $1
     ORDER BY area ASC`,
    [contactId]
  );
  return rows.map(toArea);
}

export async function createArea(
  contactId: string,
  username: string,
  area: string
): Promise<ContactArea> {
  const rows = await notesQuery<AreaRow>(
    `INSERT INTO contact_areas (contact_id, username, area)
     VALUES ($1, $2, $3)
     RETURNING area_id, contact_id, username, area, created_at`,
    [contactId, username, area]
  );
  return toArea(rows[0]);
}

// Delete a tag — only if the username matches (owner check at DB level)
export async function deleteArea(
  areaId: string,
  username: string
): Promise<boolean> {
  const rows = await notesQuery<{ area_id: string }>(
    `DELETE FROM contact_areas
     WHERE tag_id = $1 AND username = $2
     RETURNING area_id`,
    [areaId, username]
  );
  return rows.length > 0;
}

/**
 * Returns all contact_ids for the tag
 */
export async function getAreaContactIds(area: string): Promise<string[]> {
  const rows = await notesQuery<AreaRow>(
    `SELECT contact_id
     FROM contact_areas
     WHERE area = $1
     ORDER BY created_at DESC`,
    [area]
  );
  return rows.map((r) => r.contact_id);
}