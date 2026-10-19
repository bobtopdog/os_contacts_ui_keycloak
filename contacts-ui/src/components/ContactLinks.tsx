'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLinks, postLink, patchLink, deleteLink } from '@/libs/api';
import OutcomeSelector from '@/components/OutcomeSelector';
import OutcomeBadge from '@/components/OutcomeBadge';
import { EMPTY_OUTCOME, type OutcomeValue } from '@/types/outcome';
import type { ContactLink } from '@/types/contact';

const OPENTEXT_BASE = process.env.NEXT_PUBLIC_OPENTEXT_BASE_URL ?? '';

function buildUrl(reference: string) {
  return `${OPENTEXT_BASE}${reference}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}


// ---------------------------------------------------------------------------
// LinkCard — view / edit / delete for one link
// ---------------------------------------------------------------------------
function LinkCard({
  link, currentUsername, onChanged,
}: {
  link: ContactLink;
  currentUsername: string;
  onChanged: () => void;
}) {
  const isOwner = link.username === currentUsername;

  const [isEditing, setIsEditing] = useState(false);
  const [editReference, setEditReference] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editOutcome, setEditOutcome] = useState<OutcomeValue>(EMPTY_OUTCOME);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Load the record's CURRENT values into the edit state each time edit
  // opens. (Initialising via useState(link.outcomeId) only happens once on
  // mount, so it can go stale — this is why the dropdowns came up empty.)
  function startEdit() {
    setEditReference(link.reference);
    setEditLabel(link.label);
    setEditOutcome({ outcomeId: link.outcomeId, subOutcomeId: link.subOutcomeId });
    setError('');
    setIsEditing(true);
  }

  async function handleSave() {
    if (!editReference.trim()) return;
    setBusy(true);
    setError('');
    try {
      await patchLink(link.linkId, {
        username: currentUsername,
        reference: editReference.trim(),
        label: editLabel.trim(),
        ...editOutcome,                 // ← always send the outcome pair
      });
      setIsEditing(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update link');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError('');
    try {
      await deleteLink(link.linkId, currentUsername);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete link');
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className={`card border-0 mb-2 ${isOwner ? 'bg-primary bg-opacity-10' : 'bg-light'}`}>
      <div className="card-body py-2 px-3">

        {/* ---------------- View mode ---------------- */}
        {!isEditing && !confirmDelete && (
          <>
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div className="overflow-hidden">
                <a
                  href={buildUrl(link.reference)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fw-medium text-decoration-none text-truncate d-block"
                >
                  🔗 {link.label || link.reference}
                </a>
                {link.label && (
                  <small className="text-muted d-block text-truncate">{link.reference}</small>
                )}
              </div>
              {isOwner && (
                <div className="d-flex gap-1 flex-shrink-0">
                  <button className="btn btn-outline-secondary btn-sm py-0" onClick={startEdit} title="Edit">
                    ✏️
                  </button>
                  <button className="btn btn-outline-danger btn-sm py-0" onClick={() => setConfirmDelete(true)} title="Delete">
                    🗑️
                  </button>
                </div>
              )}
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2 mt-1">
              {/* Renders nothing if no outcome is set */}
              <OutcomeBadge outcomeId={link.outcomeId} subOutcomeId={link.subOutcomeId} />
              <small className="text-muted">
                👤 <strong>{link.username}</strong>
                {isOwner && <span className="badge bg-primary ms-1 rounded-pill">you</span>}
                {' '}&middot;{' '}{formatDate(link.createdAt)}
              </small>
            </div>
          </>
        )}

        {/* ---------------- Edit mode ---------------- */}
        {isEditing && (
          <>
            <div className="row g-2 mb-2">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-medium mb-1">Reference *</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={editReference}
                  onChange={(e) => setEditReference(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-medium mb-1">Label</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  disabled={busy}
                />
              </div>
            </div>

            <div className="mb-2">
              <OutcomeSelector value={editOutcome} onChange={setEditOutcome} disabled={busy} />
            </div>

            {editReference.trim() && (
              <small className="text-muted d-block mb-2 text-truncate">
                Preview: {buildUrl(editReference.trim())}
              </small>
            )}

            {error && <div className="alert alert-danger py-1 small mb-2">{error}</div>}

            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setIsEditing(false)} disabled={busy}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!editReference.trim() || busy}>
                {busy ? <><span className="spinner-border spinner-border-sm me-1" />Saving…</> : 'Save changes'}
              </button>
            </div>
          </>
        )}

        {/* ---------------- Delete confirmation ---------------- */}
        {confirmDelete && (
          <>
            <p className="mb-2 text-danger fw-medium small">Delete this link? This cannot be undone.</p>
            {error && <div className="alert alert-danger py-1 small mb-2">{error}</div>}
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setConfirmDelete(false)} disabled={busy}>
                Cancel
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={busy}>
                {busy ? <><span className="spinner-border spinner-border-sm me-1" />Deleting…</> : 'Yes, delete'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ContactLinks — add form + list
// ---------------------------------------------------------------------------
export default function ContactLinks({ contactId }: { contactId: string }) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const username = session?.user?.username ?? '';

  const [reference, setReference] = useState('');
  const [label, setLabel] = useState('');
  const [outcome, setOutcome] = useState<OutcomeValue>(EMPTY_OUTCOME);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: links, isLoading, isError } = useQuery<ContactLink[]>({
    queryKey: ['links', contactId],
    //queryFn: () => getLinks(contactId),
    queryFn: async () => {
    const data = await getLinks(contactId);
    console.log('Query returned:', data);
    return data;
  },

  });

  
  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['links', contactId] });
  }

  async function handleAdd() {
    if (!reference.trim() || !username) return;
    setIsSaving(true);
    setError('');
    try {
      await postLink({
        contactId,
        username,
        reference: reference.trim(),
        label: label.trim(),
        ...outcome,
      });
      setReference('');
      setLabel('');
      setOutcome(EMPTY_OUTCOME);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save link');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-4">
      <h5 className="fw-semibold mb-3">🔗 Document links</h5>

      {status === 'authenticated' ? (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <p className="fw-medium mb-2">Add a link</p>

            <div className="row g-2 mb-2">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-medium mb-1">Reference *</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="OpenText reference…"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-medium mb-1">Label</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Optional description…"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="mb-2">
              <OutcomeSelector value={outcome} onChange={setOutcome} disabled={isSaving} />
            </div>

            {reference.trim() && (
              <small className="text-muted d-block mb-2 text-truncate">
                Preview: {buildUrl(reference.trim())}
              </small>
            )}

            {error && <div className="alert alert-danger py-1 small mb-2">{error}</div>}

            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">Saving as <strong>{username}</strong></small>
              <button
                className="btn btn-primary btn-sm px-4"
                onClick={handleAdd}
                disabled={!reference.trim() || isSaving}
              >
                {isSaving ? <><span className="spinner-border spinner-border-sm me-1" />Saving…</> : 'Add link'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info py-2 small mb-4">Please sign in to add links.</div>
      )}

      {isLoading && (
        <div className="text-center text-muted py-3">
          <span className="spinner-border spinner-border-sm me-2" />Loading links…
        </div>
      )}
      {isError && (
        <div className="alert alert-warning py-2 small">Could not load links. Please try refreshing.</div>
      )}
      {links && links.length === 0 && (
        <p className="text-muted small">No links yet for this contact.</p>
      )}
      {links?.map((link) => (
        <LinkCard key={link.linkId} link={link} currentUsername={username} onChanged={refresh} />
      ))}
    </div>
  );
}
