'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCommunityHeadlines, postCommunityHeadline, patchCommunityHeadline, deleteCommunityHeadline,
} from '@/libs/communityPagesApi';
import type { CommunityHeadline } from '@/types/communityPages';

interface Props { communityId: string; username: string; isMember: boolean; }

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function HeadlineCard({ h, username, onChanged }: { h: CommunityHeadline; username: string; onChanged: () => void }) {
  const isOwner = h.username === username;
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(h.title);
  const [body, setBody] = useState(h.body);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setBusy(true); setError('');
    try { await patchCommunityHeadline(h.headlineId, username, title.trim(), body.trim()); setEditing(false); onChanged(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError('');
    try { await deleteCommunityHeadline(h.headlineId, username); onChanged(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed'); setBusy(false); setConfirmDelete(false); }
  }

  return (
    <div className={`card border-0 mb-2 ${isOwner ? 'bg-primary bg-opacity-10' : 'bg-light'}`}>
      <div className="card-body py-2 px-3">
        {error && <div className="alert alert-danger py-1 small mb-2">{error}</div>}
        {!editing && !confirmDelete && (
          <>
            <div className="d-flex justify-content-between align-items-start gap-2">
              <span className="fw-semibold">📰 {h.title}</span>
              {isOwner && (
                <div className="d-flex gap-1 flex-shrink-0">
                  <button className="btn btn-outline-secondary btn-sm py-0" onClick={() => setEditing(true)}>✏️</button>
                  <button className="btn btn-outline-danger btn-sm py-0" onClick={() => setConfirmDelete(true)}>🗑️</button>
                </div>
              )}
            </div>
            {h.body && <p className="mb-1 small mt-1" style={{ whiteSpace: 'pre-wrap' }}>{h.body}</p>}
            <small className="text-muted">👤 <strong>{h.username}</strong>{isOwner && <span className="badge bg-primary ms-1 rounded-pill">you</span>} &middot; {formatDate(h.createdAt)}</small>
          </>
        )}
        {editing && (
          <>
            <input className="form-control form-control-sm mb-2" value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy} />
            <textarea className="form-control form-control-sm mb-2" rows={3} value={body} onChange={(e) => setBody(e.target.value)} disabled={busy} />
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => { setEditing(false); setTitle(h.title); setBody(h.body); }} disabled={busy}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={!title.trim() || busy}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </>
        )}
        {confirmDelete && (
          <>
            <p className="text-danger fw-medium small mb-2">Delete this headline?</p>
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

/** Shared headlines — readable by everyone, added by members, edited by author. */
export default function CommunityHeadlines({ communityId, username, isMember }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const { data: headlines, isLoading } = useQuery<CommunityHeadline[]>({
    queryKey: ['community-headlines', communityId],
    queryFn: () => getCommunityHeadlines(communityId),
  });
  function refresh() { queryClient.invalidateQueries({ queryKey: ['community-headlines', communityId] }); }

  async function add() {
    setBusy(true); setError('');
    try { await postCommunityHeadline(communityId, username, title.trim(), body.trim()); setTitle(''); setBody(''); setOpen(false); refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setBusy(false); }
  }

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
        <h6 className="fw-semibold mb-0">📰 Headlines</h6>
        {isMember && !open && <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>+ Add headline</button>}
      </div>
      <div className="card-body py-2">
        {open && (
          <div className="card border-0 bg-light mb-3">
            <div className="card-body py-2">
              <input className="form-control form-control-sm mb-2" placeholder="Headline title *" value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy} autoFocus />
              <textarea className="form-control form-control-sm mb-2" rows={3} placeholder="Details (optional)" value={body} onChange={(e) => setBody(e.target.value)} disabled={busy} />
              {error && <div className="alert alert-danger py-1 small mb-2">{error}</div>}
              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={add} disabled={!title.trim() || busy}>{busy ? 'Saving…' : 'Post'}</button>
              </div>
            </div>
          </div>
        )}
        {isLoading && <span className="spinner-border spinner-border-sm text-muted" />}
        {headlines && headlines.length === 0 && <p className="text-muted small mb-0">No headlines yet.</p>}
        {headlines?.map((h) => <HeadlineCard key={h.headlineId} h={h} username={username} onChanged={refresh} />)}
      </div>
    </div>
  );
}
