import { notesQuery } from './notesDb';
import type { ContactAnexNote } from '@/types/contact';

interface AnexNoteRow {
  note_id: string;
  contact_id: string;
  username: string;
  comment: string;
  created_at: Date;
}

function toNote(row: AnexNoteRow): ContactAnexNote {
  return {
    noteId: row.note_id,
    contactId: row.contact_id,
    username: row.username,
    comment: row.comment,
    createdAt: row.created_at.toISOString(),
  };
}

// Fetch all notes for a contact, newest first
export async function getNotesByContactId(contactId: string): Promise<ContactAnexNote[]> {
  const rows = await notesQuery<AnexNoteRow>(
    `SELECT note_id, contact_id, username, comment, created_at
     FROM contact_anex_notes
     WHERE contact_id = $1
     ORDER BY created_at DESC`,
    [contactId]
  );
  return rows.map(toNote);
}

// Insert a new note
export async function createNote(
  contactId: string,
  username: string,
  comment: string
): Promise<ContactAnexNote> {
  const rows = await notesQuery<AnexNoteRow>(
    `INSERT INTO contact_anex_notes (contact_id, username, comment)
     VALUES ($1, $2, $3)
     RETURNING note_id, contact_id, username, comment, created_at`,
    [contactId, username, comment]
  );
  return toNote(rows[0]);
}

// Update a note — only if the username matches (owner check at DB level)
export async function updateNote(
  noteId: string,
  username: string,
  comment: string
): Promise<ContactAnexNote | null> {
  const rows = await notesQuery<AnexNoteRow>(
    `UPDATE contact_anex_notes
     SET comment = $1
     WHERE note_id = $2 AND username = $3
     RETURNING note_id, contact_id, username, comment, created_at`,
    [comment, noteId, username]
  );
  return rows.length ? toNote(rows[0]) : null;
}

// Delete a note — only if the username matches (owner check at DB level)
export async function deleteNote(
  noteId: string,
  username: string
): Promise<boolean> {
  const rows = await notesQuery<{ note_id: string }>(
    `DELETE FROM contact_anex_notes
     WHERE note_id = $1 AND username = $2
     RETURNING note_id`,
    [noteId, username]
  );
  return rows.length > 0;
}
