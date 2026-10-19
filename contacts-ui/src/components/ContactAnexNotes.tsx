'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAnexNotes, postAnexNote, patchAnexNote, deleteAnexNote } from '@/libs/api';
import type { ContactAnexNote } from '@/types/contact';
import OutcomeSelector from '@/components/OutcomeSelector';
import OutcomeBadge from '@/components/OutcomeBadge';
import { EMPTY_OUTCOME, type OutcomeValue } from '@/types/outcome';


interface Props {
  contactId: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NoteCard({
  note,
  currentUsername,
  onUpdate,
  onDelete,
}: {
  note: ContactAnexNote;
  currentUsername: string;
  onUpdate: (noteId: string, comment: string, outcome: OutcomeValue) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
}) {
  const isOwner = note.username === currentUsername;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(note.comment);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const [editOutcome, setEditOutcome] = useState<OutcomeValue>({
      outcomeId: note.outcomeId, subOutcomeId: note.subOutcomeId,
    });

  async function handleSaveEdit() {
    if (!editValue.trim()) return;
    setIsSaving(true);
    setError('');
    try {
      await onUpdate(note.noteId, editValue.trim(), editOutcome);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditValue(note.comment);
    setEditOutcome({ outcomeId: note.outcomeId, subOutcomeId: note.subOutcomeId });
    setIsEditing(false);
    setError('');
  }

  async function handleConfirmDelete() {
    setIsDeleting(true);
    setError('');
    try {
      await onDelete(note.noteId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
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
            <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>{note.comment}</p>
            <OutcomeBadge outcomeId={note.outcomeId} subOutcomeId={note.subOutcomeId} />
            <div className="d-flex justify-content-between align-items-center mt-1">
              <small className="text-muted">
                👤 <strong>{note.username}</strong>
                {isOwner && (
                  <span className="badge bg-primary ms-2 rounded-pill">you</span>
                )}
                {' '}&middot;{' '}{formatDate(note.createdAt)}
              </small>
              {isOwner && (
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary btn-sm py-0"
                    onClick={() => {
                      setEditValue(note.comment);
                      setEditOutcome({ outcomeId: note.outcomeId, subOutcomeId: note.subOutcomeId });
                      setIsEditing(true);
                    }}
                    title="Edit note"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm py-0"
                    onClick={() => setConfirmDelete(true)}
                    title="Delete note"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Inline edit mode */}
        {isEditing && (
          <>
            <textarea
              className="form-control mb-2"
              rows={3}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              disabled={isSaving}
              autoFocus
            />
            {error && (
              <div className="alert alert-danger py-1 small mb-2">{error}</div>
            )}
            <div className="mb-2">
              <OutcomeSelector value={editOutcome} onChange={setEditOutcome} disabled={isSaving} />
            </div>
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
                disabled={!editValue.trim() || isSaving}
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
              Are you sure you want to delete this note? This cannot be undone.
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

export default function ContactAnexNotes({ contactId }: Props) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const username = session?.user?.username ?? '';
   const [outcome, setOutcome] = useState<OutcomeValue>(EMPTY_OUTCOME);

  const { data: anexnotes, isLoading, isError } = useQuery<ContactAnexNote[]>({
    queryKey: ['anexnotes', contactId],
    queryFn: () => getAnexNotes(contactId),
  });

  const addMutation = useMutation({
    mutationFn: postAnexNote,
    onSuccess: () => {
      setComment('');
      setSaveError('');
      queryClient.invalidateQueries({ queryKey: ['anexnotes', contactId] });
      setOutcome(EMPTY_OUTCOME);
    },
    onError: (err: Error) => setSaveError(err.message),
  });
  
  async function handleUpdate(noteId: string, newComment: string, editOutcome: OutcomeValue) {
    await patchAnexNote(noteId, username, newComment, editOutcome.outcomeId, editOutcome.subOutcomeId);
    queryClient.invalidateQueries({ queryKey: ['anexnotes', contactId] });
  }

  async function handleDelete(noteId: string) {
    await deleteAnexNote(noteId, username);
    queryClient.invalidateQueries({ queryKey: ['anexnotes', contactId] });
  }

  function handleSave() {
    if (!comment.trim() || !username) return;
    setSaveError('');
    addMutation.mutate({ contactId, username, comment: comment.trim(), outcomeId: outcome.outcomeId, subOutcomeId: outcome.subOutcomeId });
  }

  return (
    <div className="mt-1">
      

      {status === 'authenticated' ? (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <label htmlFor="noteComment" className="form-label fw-medium">Add a note</label>
            <textarea
              id="noteComment"
              className="form-control mb-2"
              rows={3}
              placeholder="Type your note here…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={addMutation.isPending}
            />
            <div className="mb-2">
              <OutcomeSelector value={outcome} onChange={setOutcome} disabled={addMutation.isPending} />
            </div>
            {saveError && (
              <div className="alert alert-danger py-2 small mb-2">{saveError}</div>
            )}
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">Saving as <strong>{username}</strong></small>
              <button
                className="btn btn-primary btn-sm px-4"
                onClick={handleSave}
                disabled={!comment.trim() || addMutation.isPending}
              >
                {addMutation.isPending ? (
                  <><span className="spinner-border spinner-border-sm me-1" role="status" />Saving…</>
                ) : 'Save note'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info py-2 small mb-4">Please sign in to add notes.</div>
      )}

      {isLoading && (
        <div className="text-center text-muted py-3">
          <span className="spinner-border spinner-border-sm me-2" />Loading notes…
        </div>
      )}

      {isError && (
        <div className="alert alert-warning py-2 small">Could not load notes. Please try refreshing.</div>
      )}

      {anexnotes && anexnotes.length === 0 && (
        <p className="text-muted small">No notes yet for this contact.</p>
      )}

      {anexnotes && anexnotes.length > 0 && (
        <div>
          {anexnotes.map((note) => (
            <NoteCard
              key={note.noteId}
              note={note}
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
