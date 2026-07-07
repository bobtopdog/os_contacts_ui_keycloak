import type { MinisterNote} from '@/types/minister';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
// Notes are served by this Next.js app's own API routes (direct notes DB connection)
const NOTES_API = process.env.NEXT_PUBLIC_NOTES_API_URL ?? 'http://localhost:3000';


// ---- Notes (read/write, via this app's own API routes on port 3000) -------

export async function getNotes(memberId: number): Promise<MinisterNote[]> {
  const res = await fetch(`${NOTES_API}/api/ministernotes/${memberId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch notes: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function getMyNotes(userName: string): Promise<MinisterNote[]> {
  const res = await fetch(`${NOTES_API}/api/ministernotes/mynotes/${userName}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch notes: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function postNote(payload: {
  memberId: number;
  username: string;
  comment: string;
}): Promise<MinisterNote> {
  const res = await fetch(`${NOTES_API}/api/ministernotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to save note: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function patchNote(
  noteId: string,
  username: string,
  comment: string
): Promise<MinisterNote> {
  const res = await fetch(`${NOTES_API}/api/ministernotes/note/${noteId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, comment }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to update note: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function deleteNote(
  noteId: string,
  username: string
): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/ministernotes/note/${noteId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to delete note: ${res.status}`);
  }
}