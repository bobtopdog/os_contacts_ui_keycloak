'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLinks, postLink, patchLink, deleteLink } from '@/libs/api';
import type { ContactLink } from '@/types/contact';

interface Props {
  contactId: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_OPENTEXT_BASE_URL ?? '';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// LinkCard — view, inline edit, delete confirmation
// ---------------------------------------------------------------------------
function LinkCard({
  link,
  currentUsername,
  onUpdate,
  onDelete,
}: {
  link: ContactLink;
  currentUsername: string;
  onUpdate: (linkId: string, reference: string, label: string) => Promise<void>;
  onDelete: (linkId: string) => Promise<void>;
}) {
  const isOwner = link.username === currentUsername;
  const [isEditing, setIsEditing] = useState(false);
  const [editRef, setEditRef] = useState(link.reference);
  const [editLabel, setEditLabel] = useState(link.label);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const fullUrl = `${BASE_URL}${link.reference}`;

  async function handleSaveEdit() {
    if (!editRef.trim()) return;
    setIsSaving(true);
    setError('');
    try {
      await onUpdate(link.linkId, editRef.trim(), editLabel.trim());
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update link');
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditRef(link.reference);
    setEditLabel(link.label);
    setIsEditing(false);
    setError('');
  }

  async function handleConfirmDelete() {
    setIsDeleting(true);
    setError('');
    try {
      await onDelete(link.linkId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete link');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className={`card border-0 mb-3 ${isOwner ? 'bg-primary bg-opacity-10' : 'bg-light'}`}>
      <div className="card-body py-2 px-3">

        {/* View mode */}
        {!isEditing && !confirmDelete && (
          <>
            <div className="d-flex align-items-start justify-content-between gap-2">
              <div className="overflow-hidden">
                {/* Clickable link to OpenText document */}
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fw-medium text-primary text-decoration-none d-flex align-items-center gap-1"
                >
                  🔗 {link.label || link.reference}
                  <small className="text-muted ms-1">↗</small>
                </a>
                {/* Show reference number if a label is set */}
                {link.label && (
                  <small className="text-muted d-block">Ref: {link.reference}</small>
                )}
              </div>

              {/* Edit / Delete — owner only */}
              {isOwner && (
                <div className="d-flex gap-2 flex-shrink-0">
                  <button
                    className="btn btn-outline-secondary btn-sm py-0"
                    onClick={() => setIsEditing(true)}
                    title="Edit link"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm py-0"
                    onClick={() => setConfirmDelete(true)}
                    title="Delete link"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>

            <small className="text-muted d-block mt-1">
              👤 <strong>{link.username}</strong>
              {isOwner && <span className="badge bg-primary ms-2 rounded-pill">you</span>}
              {' '}&middot;{' '}{formatDate(link.createdAt)}
            </small>
          </>
        )}

        {/* Inline edit mode */}
        {isEditing && (
          <>
            <div className="mb-2">
              <label className="form-label small fw-medium mb-1">
                Reference number <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={editRef}
                onChange={(e) => setEditRef(e.target.value)}
                disabled={isSaving}
                placeholder="e.g. DOC-12345"
                autoFocus
              />
              {BASE_URL && editRef && (
                <small className="text-muted">
                  Preview: {BASE_URL}{editRef}
                </small>
              )}
            </div>
            <div className="mb-2">
              <label className="form-label small fw-medium mb-1">
                Label <span className="text-muted">(optional)</span>
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                disabled={isSaving}
                placeholder="e.g. Contract Agreement 2024"
              />
            </div>

            {error && (
              <div className="alert alert-danger py-1 small mb-2">{error}</div>
            )}

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveEdit}
                disabled={!editRef.trim() || isSaving}
              >
                {isSaving ? (
                  <><span className="spinner-border spinner-border-sm me-1" role="status" />Saving…</>
                ) : 'Save changes'}
              </button>
            </div>
          </>
        )}

        {/* Delete confirmation */}
        {confirmDelete && (
          <>
            <p className="mb-2 text-danger fw-medium">
              Are you sure you want to delete this link? This cannot be undone.
            </p>
            {error && (
              <div className="alert alert-danger py-1 small mb-2">{error}</div>
            )}
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <><span className="spinner-border spinner-border-sm me-1" role="status" />Deleting…</>
                ) : 'Yes, delete'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ContactLinks component
// ---------------------------------------------------------------------------
export default function ContactLinks({ contactId }: Props) {
  console.log ('ContactLinks contactId: ', contactId);
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [reference, setReference] = useState('');
  const [label, setLabel] = useState('');
  const [saveError, setSaveError] = useState('');

  const username = session?.user?.username ?? '';

  const { data: links, isLoading, isError, error } = useQuery<ContactLink[]>({
    queryKey: ['links', contactId],
    queryFn: () => getLinks(contactId),
  });

  console.log ('links data', links);
  console.log ('isLoading', isLoading);
  console.log ('isError', isError);
 console.log ('error', error);

  const addMutation = useMutation({
    mutationFn: postLink,
    onSuccess: () => {
      setReference('');
      setLabel('');
      setSaveError('');
      queryClient.invalidateQueries({ queryKey: ['links', contactId] });
    },
    onError: (err: Error) => setSaveError(err.message),
  });

  async function handleUpdate(linkId: string, newReference: string, newLabel: string) {
    await patchLink(linkId, username, newReference, newLabel);
    queryClient.invalidateQueries({ queryKey: ['links', contactId] });
  }

  async function handleDelete(linkId: string) {
    await deleteLink(linkId, username);
    queryClient.invalidateQueries({ queryKey: ['links', contactId] });
  }

  function handleSave() {
    if (!reference.trim() || !username) return;
    setSaveError('');
    addMutation.mutate({ contactId, username, reference: reference.trim(), label: label.trim() });
  }

  return (
    <div className="mt-1">
      

      {/* Add link form — authenticated users only */}
      {status === 'authenticated' ? (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <p className="fw-medium mb-3">Add a document link</p>

            <div className="mb-2">
              <label htmlFor="linkReference" className="form-label small fw-medium mb-1">
                Reference number <span className="text-danger">*</span>
              </label>
              <input
                id="linkReference"
                type="text"
                className="form-control"
                placeholder="e.g. DOC-12345"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                disabled={addMutation.isPending}
              />
              {/* Live URL preview */}
              {BASE_URL && reference && (
                <small className="text-muted d-block mt-1">
                  🔗 Preview: {BASE_URL}{reference}
                </small>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="linkLabel" className="form-label small fw-medium mb-1">
                Label <span className="text-muted">(optional)</span>
              </label>
              <input
                id="linkLabel"
                type="text"
                className="form-control"
                placeholder="e.g. Contract Agreement 2024"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={addMutation.isPending}
              />
            </div>

            {saveError && (
              <div className="alert alert-danger py-2 small mb-2">{saveError}</div>
            )}

            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">Adding as <strong>{username}</strong></small>
              <button
                className="btn btn-primary btn-sm px-4"
                onClick={handleSave}
                disabled={!reference.trim() || addMutation.isPending}
              >
                {addMutation.isPending ? (
                  <><span className="spinner-border spinner-border-sm me-1" role="status" />Saving…</>
                ) : 'Add link'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info py-2 small mb-4">
          Please sign in to add document links.
        </div>
      )}

      {/* Links list — all users can see */}
      {isLoading && (
        <div className="text-center text-muted py-3">
          <span className="spinner-border spinner-border-sm me-2" />Loading links…
        </div>
      )}

      {isError && (
        <div className="alert alert-warning py-2 small">
          Could not load links. Please try refreshing.
        </div>
      )}

      {links && links.length === 0 && (
        <p className="text-muted small">No document links yet for this contact.</p>
      )}

      {links && links.length > 0 && (
        <div>
          {links.map((link) => (
            <LinkCard
              key={link.linkId}
              link={link}
              currentUsername={username}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
