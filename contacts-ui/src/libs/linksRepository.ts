import { notesQuery } from './notesDb';
import type { ContactLink } from '@/types/contact';

interface LinkRow {
  link_id: string;
  contact_id: string;
  username: string;
  reference: string;
  label: string;
  created_at: Date;
  updated_at: Date;
}

function toLink(row: LinkRow): ContactLink {
  return {
    linkId: row.link_id,
    contactId: row.contact_id,
    username: row.username,
    reference: row.reference,
    label: row.label,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

// Fetch all links for a contact, newest first
export async function getLinksByContactId(contactId: string): Promise<ContactLink[]> {
  const rows = await notesQuery<LinkRow>(
    `SELECT link_id, contact_id, username, reference, label, created_at, updated_at
     FROM contact_links
     WHERE contact_id = $1
     ORDER BY created_at DESC`,
    [contactId]
  );
  return rows.map(toLink);
}

// Insert a new link
export async function createLink(
  contactId: string,
  username: string,
  reference: string,
  label: string
): Promise<ContactLink> {
  const rows = await notesQuery<LinkRow>(
    `INSERT INTO contact_links (contact_id, username, reference, label)
     VALUES ($1, $2, $3, $4)
     RETURNING link_id, contact_id, username, reference, label, created_at, updated_at`,
    [contactId, username, reference, label]
  );
  return toLink(rows[0]);
}

// Update a link — owner check enforced at DB level
export async function updateLink(
  linkId: string,
  username: string,
  reference: string,
  label: string
): Promise<ContactLink | null> {
  const rows = await notesQuery<LinkRow>(
    `UPDATE contact_links
     SET reference = $1, label = $2
     WHERE link_id = $3 AND username = $4
     RETURNING link_id, contact_id, username, reference, label, created_at, updated_at`,
    [reference, label, linkId, username]
  );
  return rows.length ? toLink(rows[0]) : null;
}

// Delete a link — owner check enforced at DB level
export async function deleteLink(
  linkId: string,
  username: string
): Promise<boolean> {
  const rows = await notesQuery<{ link_id: string }>(
    `DELETE FROM contact_links
     WHERE link_id = $1 AND username = $2
     RETURNING link_id`,
    [linkId, username]
  );
  return rows.length > 0;
}
