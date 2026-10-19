import { notesQuery } from './notesDb';
import type { ContactAnexNote } from '@/types/contact';

interface AnexNoteRow {
  note_id: string;
  contact_id: string;
  username: string;
  comment: string;
  created_at: Date;
  outcome_id: number | null;
  sub_outcome_id: number | null;
}

function toNote(row: AnexNoteRow): ContactAnexNote {
  return {
    noteId: row.note_id,
    contactId: row.contact_id,
    username: row.username,
    comment: row.comment,
    createdAt: row.created_at.toISOString(),
    outcomeId: row.outcome_id,
    subOutcomeId: row.sub_outcome_id,
  };
}

// Fetch all notes for a contact, newest first
export async function getNotesByContactId(contactId: string): Promise<ContactAnexNote[]> {
  const rows = await notesQuery<AnexNoteRow>(
    `SELECT note_id, contact_id, username, comment, created_at, outcome_id, sub_outcome_id
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
  comment: string,
  outcomeId: number | null,
  subOutcomeId: number | null
): Promise<ContactAnexNote> {
  const rows = await notesQuery<AnexNoteRow>(
    `INSERT INTO contact_anex_notes (contact_id, username, comment, outcome_id, sub_outcome_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING note_id, contact_id, username, comment, created_at, outcome_id, sub_outcome_id`,
    [contactId, username, comment, outcomeId, subOutcomeId]
  );
  return toNote(rows[0]);
}

// Update a note — only if the username matches (owner check at DB level)
export async function updateNote(
  noteId: string,
  username: string,
  comment: string,
  outcomeId: number | null,
  subOutcomeId: number | null
): Promise<ContactAnexNote | null> {
  const rows = await notesQuery<AnexNoteRow>(
    `UPDATE contact_anex_notes
     SET comment = $1, outcome_id = $2, sub_outcome_id = $3
     WHERE note_id = $4 AND username = $5
     RETURNING note_id, contact_id, username, comment, created_at, outcome_id, sub_outcome_id`,
    [comment, outcomeId, subOutcomeId, noteId, username]
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
