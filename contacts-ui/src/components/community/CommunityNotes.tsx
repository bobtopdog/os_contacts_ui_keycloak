'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMyCommunityNote, postCommunityNote, patchCommunityNote, deleteCommunityNote,
} from '@/libs/communityPagesApi';
import type { CommunityNote } from '@/types/communityPages';

interface Props { communityId: string; username: string; isMember: boolean; }

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** The caller's private note — one per user, visible only to its author. */
export default function CommunityNotes({ communityId, username, isMember }: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const { data: note, isLoading } = useQuery<CommunityNote | null>({
    queryKey: ['community-note', communityId, username],
    queryFn: () => getMyCommunityNote(communityId, username),
    enabled: !!username,
  });

  function refresh() { queryClient.invalidateQueries({ queryKey: ['community-note', communityId, username] }); }

  async function save() {
    if (!value.trim()) return;
    setBusy(true); setError('');
    try {
      if (note) await patchCommunityNote(note.noteId, username, value.trim());
      else await postCommunityNote(communityId, username, value.trim());
      setEditing(false); refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!note) return;
    setBusy(true); setError('');
    try { await deleteCommunityNote(note.noteId, username); setConfirmDelete(false); refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setBusy(false); }
  }

  if (!isMember) return null;   // private notes are a members-only feature

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
        <h6 className="fw-semibold mb-0">🔒 My private note</h6>
        {note && !editing && !confirmDelete && (
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm py-0" onClick={() => { setValue(note.comment); setEditing(true); }}>✏️ Edit</button>
            <button className="btn btn-outline-danger btn-sm py-0" onClick={() => setConfirmDelete(true)}>🗑️</button>
          </div>
        )}
      </div>
      <div className="card-body py-2">
        {isLoading && <span className="spinner-border spinner-border-sm text-muted" />}
        {error && <div className="alert alert-danger py-1 small mb-2">{error}</div>}

        {!isLoading && !note && !editing && (
          <button className="btn btn-primary btn-sm" onClick={() => { setValue(''); setEditing(true); }}>+ Add a private note</button>
        )}

        {editing && (
          <>
            <textarea className="form-control mb-2" rows={4} value={value} onChange={(e) => setValue(e.target.value)} disabled={busy} autoFocus />
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditing(false)} disabled={busy}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={!value.trim() || busy}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </>
        )}

        {note && !editing && !confirmDelete && (
          <>
            <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>{note.comment}</p>
            <small className="text-muted">Only you can see this &middot; updated {formatDate(note.updatedAt)}</small>
          </>
        )}

        {confirmDelete && (
          <>
            <p className="text-danger fw-medium small mb-2">Delete your private note?</p>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setConfirmDelete(false)} disabled={busy}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={remove} disabled={busy}>{busy ? 'Deleting…' : 'Yes, delete'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
