import { notesQuery } from './notesDb';
import type { ContactPoc } from '@/types/contact';

interface PocRow {
  poc_id: string;
  contact_id: string;
  username: string;
  details: string;
  created_at: Date;
}

function toPoc(row: PocRow): ContactPoc {
  return {
    pocId: row.poc_id,
    contactId: row.contact_id,
    username: row.username,
    details: row.details,
    createdAt: row.created_at.toISOString(),
  };
}


export async function getPocByContactId(contactId: string): Promise<ContactPoc[]> {
  const rows = await notesQuery<PocRow>(
    `SELECT poc_id, contact_id, username, details, created_at
     FROM contact_poc
     WHERE contact_id = $1
     ORDER BY created_at DESC`,
    [contactId]
  );
  return rows.map(toPoc);
}

// Insert a new note — returns null if the user already has a note for this contact
export async function createPoc(
  contactId: string,
  username: string,
  details: string
): Promise<ContactPoc| null> {
  // Check if this user already has a note for this contact
  const existing = await notesQuery<{ note_id: string }>(
    `SELECT poc_id FROM contact_poc
     WHERE contact_id = $1 AND username = $2 LIMIT 1`,
    [contactId, username]
  );
  if (existing.length > 0) return null;

  const rows = await notesQuery<PocRow>(
    `INSERT INTO contact_poc (contact_id, username, details)
     VALUES ($1, $2, $3)
     RETURNING poc_id, contact_id, username, details, created_at`,
    [contactId, username, details]
  );
  return toPoc(rows[0]);
}

/* export async function createPoc1(
  contactId: string,
  username: string,
  details: string
): Promise<ContactPoc> {
  const rows = await notesQuery<PocRow>(
    `INSERT INTO contact_poc (contact_id, username, details)
     VALUES ($1, $2, $3)
     RETURNING poc_id, contact_id, username, details, created_at`,
    [contactId, username, details]
  );
  return toPoc(rows[0]);
}
 */
// Delete a note — only if the username matches (owner check at DB level)
export async function deletePoc(
  pocId: string,
  username: string
): Promise<boolean> {
  const rows = await notesQuery<{ note_id: string }>(
    `DELETE FROM contact_poc
     WHERE pocid = $1 AND username = $2
     RETURNING poc_id`,
    [pocId, username]
  );
  return rows.length > 0;
}

/**
 * Returns all contact_ids where the given username
 * has marked themselves as a point of contact.
 */
export async function getPocContactIds(username: string): Promise<string[]> {
  const rows = await notesQuery<PocRow>(
    `SELECT contact_id
     FROM contact_poc
     WHERE username = $1
     ORDER BY created_at DESC`,
    [username]
  );
  return rows.map((r) => r.contact_id);
}

