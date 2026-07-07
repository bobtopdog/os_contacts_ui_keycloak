import { notesQuery } from '../notesDb';
import type { MinisterNote } from '@/types/minister';

interface NoteRow {
  note_id: string;
  member_id: number;
  username: string;
  comment: string;
  created_at: Date;
}

function toNote(row: NoteRow): MinisterNote {
  return {
    noteId: row.note_id,
    memberId: row.member_id,
    username: row.username,
    comment: row.comment,
    createdAt: row.created_at.toISOString(),
  };
}

export async function getNotesByMemberId(memberId: number): Promise<MinisterNote[]> {
  const rows = await notesQuery<NoteRow>(
    `SELECT note_id, member_id, username, comment, created_at
     FROM ministers_notes
     WHERE member_id = $1
     ORDER BY created_at DESC`,
    [memberId]
  );
  return rows.map(toNote);
}

export async function getNotesByUserName(userName: string): Promise<MinisterNote[]> {
  const rows = await notesQuery<NoteRow>(
    `SELECT note_id, member_id, username, comment, created_at
     FROM ministers_notes
     WHERE username = $1
     ORDER BY created_at DESC`,
    [userName]
  );
  return rows.map(toNote);
}


export async function createNote(
  memberId: number,
  username: string,
  comment: string
): Promise<MinisterNote> {
  const rows = await notesQuery<NoteRow>(
    `INSERT INTO ministers_notes (member_id, username, comment)
     VALUES ($1, $2, $3)
     RETURNING note_id, member_id, username, comment, created_at`,
    [memberId, username, comment]
  );
  return toNote(rows[0]);
}

// Update a note — only if the username matches (owner check at DB level)
export async function updateNote(
  noteId: string,
  username: string,
  comment: string
): Promise<MinisterNote | null> {
  const rows = await notesQuery<NoteRow>(
    `UPDATE ministers_notes
     SET comment = $1
     WHERE note_id = $2 AND username = $3
     RETURNING note_id, member_id, username, comment, created_at`,
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
    `DELETE FROM ministers_notes
     WHERE note_id = $1 AND username = $2
     RETURNING note_id`,
    [noteId, username]
  );
  return rows.length > 0;
}

