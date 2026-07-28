import { notesQuery } from './notesDb';
import type { ContactNote } from '@/types/contact';

interface NoteRow {
  note_id: string;
  contact_id: string;
  username: string;
  comment: string;
  created_at: Date;
}

function toNote(row: NoteRow): ContactNote {
  return {
    noteId: row.note_id,
    contactId: row.contact_id,
    username: row.username,
    comment: row.comment,
    createdAt: row.created_at.toISOString(),
  };
}

export async function getNotesByContactId(contactId: string): Promise<ContactNote[]> {
  const rows = await notesQuery<NoteRow>(
    `SELECT note_id, contact_id, username, comment, created_at
     FROM contact_notes
     WHERE contact_id = $1
     ORDER BY created_at DESC`,
    [contactId]
  );
  return rows.map(toNote);
}

export async function getNotesByUserName(userName: string): Promise<ContactNote[]> {
  const rows = await notesQuery<NoteRow>(
    `SELECT note_id, contact_id, username, comment, created_at
     FROM contact_notes
     WHERE username = $1
     ORDER BY created_at DESC`,
    [userName]
  );
  return rows.map(toNote);
}


export async function createNote(
  contactId: string,
  username: string,
  comment: string
): Promise<ContactNote> {
  const rows = await notesQuery<NoteRow>(
    `INSERT INTO contact_notes (contact_id, username, comment)
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
): Promise<ContactNote | null> {
  const rows = await notesQuery<NoteRow>(
    `UPDATE contact_notes
     SET comment = $1
     WHERE note_id = $2 AND username = $3
     RETURNING note_id, contact_id, username, comment, created_at`,
    [comment, noteId, username]
  );
  return rows.length ? toNote(rows[0]) : null;
}

//Move a private note to the public anex notes
export async function moveNote1(noteId: string): Promise<ContactNote> {
  const rows = await notesQuery<NoteRow>(
    `
    WITH moved_note AS (
        DELETE FROM contact_notes
        WHERE note_id = $1
        RETURNING contact_id, username, comment, created_at
    )
    INSERT INTO contact_anex_notes (
        contact_id,
        username,
        comment,
        created_at
    )
    SELECT
        contact_id,
        username,
        comment,
        created_at
    FROM moved_note
    RETURNING *;
    `,
    [noteId]
  );

  return toNote(rows[0]);
}


// Delete a note — only if the username matches (owner check at DB level)
export async function deleteNote(
  noteId: string,
  username: string
): Promise<boolean> {
  const rows = await notesQuery<{ note_id: string }>(
    `DELETE FROM contact_notes
     WHERE note_id = $1 AND username = $2
     RETURNING note_id`,
    [noteId, username]
  );
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Move a private note to the public anex notes table (atomic CTE)
// Only the owner can move their own note.
// ---------------------------------------------------------------------------
export async function moveNote(
  noteId: string,
  username: string
): Promise<ContactNote | null> {
  const rows = await notesQuery<NoteRow>(
    `
    WITH moved_note AS (
      DELETE FROM contact_notes
      WHERE note_id = $1 AND username = $2
      RETURNING contact_id, username, comment, created_at
    )
    INSERT INTO contact_anex_notes (
      contact_id, username, comment, created_at
    )
    SELECT contact_id, username, comment, created_at
    FROM moved_note
    RETURNING note_id, contact_id, username, comment, created_at;
    `,
    [noteId, username]
  );
  return rows.length ? toNote(rows[0]) : null;
}