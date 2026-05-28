'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPoc, postPoc, deletePoc } from '@/libs/api';
import type { ContactPoc } from '@/types/contact';

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

function PocCard({
  poc,
  currentUsername,
  onDelete,
}: {
  poc: ContactPoc;
  currentUsername: string;
  onDelete: (pocId: string) => Promise<void>;
}) {
  const isOwner = poc.username === currentUsername;
  const [isEditing, setIsEditing] = useState(false);
  //const [editValue, setEditValue] = useState(note.comment);
  //const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');



  async function handleConfirmDelete() {
    setIsDeleting(true);
    setError('');
    try {
      await onDelete(poc.pocId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete PoC');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className={`card border-0 mb-3 ${isOwner ? 'bg-primary bg-opacity-10' : 'bg-light'}`}>
      <div className="card-body py-2 px-3">

        {/* View mode */}
        {!confirmDelete && (
          <>
            <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>{poc.username} | {poc.details}</p>
            <div className="d-flex justify-content-between align-items-center mt-1">
              <small className="text-muted">
                👤 <strong>{poc.username}</strong>
                {isOwner && (
                  <span className="badge bg-primary ms-2 rounded-pill">you</span>
                )}
                {' '}&middot;{' '}{formatDate(poc.createdAt)}
              </small>
              {isOwner && (
                <div className="d-flex gap-2">
                  
                  <button
                    className="btn btn-outline-danger btn-sm py-0"
                    onClick={() => setConfirmDelete(true)}
                    title="Delete PoC"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Delete confirmation */}
        {confirmDelete && (
          <>
            <p className="mb-2 text-danger fw-medium">
              Are you sure you want to delete this PoC? This cannot be undone.
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

export default function ContactPoc({ contactId }: Props) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [details, setDetails] = useState('');
  const [saveError, setSaveError] = useState('');

  const username = session?.user?.username ?? '';

  const { data: pocs, isLoading, isError } = useQuery<ContactPoc[]>({
    queryKey: ['pocs', contactId],
    queryFn: () => getPoc(contactId),
  });

   // Has the current user already posted a note for this contact?
  const userHasNote = pocs?.some((n) => n.username === username) ?? false;

 const addMutation = useMutation({
     mutationFn: postPoc,
     onSuccess: () => {
       setDetails('');
       setSaveError('');
       queryClient.invalidateQueries({ queryKey: ['pocs', contactId] });
     },
     onError: (err: Error) => setSaveError(err.message),
   });
 
  function handleSave() {
    if (!session?.user?.username) return;
    if (!session?.user?.email) return;

    setSaveError('');
    addMutation.mutate({ contactId,
    username: session.user.username,
    details: session.user.email,});
  }



  async function handleDelete(pocId: string) {
    await deletePoc(pocId, username);
    queryClient.invalidateQueries({ queryKey: ['pocs', contactId] });
  }

  return (
    <div className="mt-2">
      

      {status === 'authenticated' && !userHasNote ? (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            
            
            {saveError && (
              <div className="alert alert-danger py-2 small mb-2">{saveError}</div>
            )}
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">Click to assign yourself as a PoC</small>
              <button
                className="btn btn-outline-primary btn-sm px-4"
                onClick={handleSave}
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? (
                  <><span className="spinner-border spinner-border-sm me-1" role="status" />Saving…</>
                ) : 'Add self as PoC'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info py-2 small mb-4">You are already a PoC.</div>
      )}

      {isLoading && (
        <div className="text-center text-muted py-3">
          <span className="spinner-border spinner-border-sm me-2" />Loading Poc…
        </div>
      )}

      {isError && (
        <div className="alert alert-warning py-2 small">Could not load notes. Please try refreshing.</div>
      )}

      {pocs && pocs.length === 0 && (
        <p className="text-muted small">No PoCyet for this contact.</p>
      )}

      {pocs && pocs.length > 0 && (
        <div>
          {pocs.map((poc) => (
            <PocCard
              key={poc.pocId}
              poc={poc}
              currentUsername={username}
             
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
