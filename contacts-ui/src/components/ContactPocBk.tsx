'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPoc, postPoc } from '@/libs/api';
import type { ContactPoc } from '@/types/contact';
import Icon from '@mdi/react'
import { mdiDeleteCircleOutline } from '@mdi/js';

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

function PocCard({ poc, currentUsername  }: { poc: ContactPoc; currentUsername: string   }) {
  const isOwner = poc.username === currentUsername;
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);


  return (
  


    <div className="card border-0 bg-light mb-3">
      <div className="card-body py-2 px-3">
        <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>
          <button
                    className="btn btn-outline-danger btn-sm py-0"
                    onClick={() => setConfirmDelete(true)}
                    title="Delete note"
                  >
                    🗑️
                  </button>
            {poc.username === currentUsername ? (<>
            <Icon path={mdiDeleteCircleOutline} size={1} title="Delete youself as PoC" color="red" />&nbsp;
            </>):(<>
                      
            </>)}
            {poc.username} | {poc.details}
        </p>
        <small className="text-muted">
          <strong></strong>Since: {formatDate(poc.createdAt)}
        </small>
      </div>
    </div>

    
  );
}


export default function ContactPoc({ contactId }: Props) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [details, setDetails] = useState('');
  const [saveError, setSaveError] = useState('');

  // Fetch existing Poc
  const {
    data: pocs,
    isLoading,
    isError,
  } = useQuery<ContactPoc[]>({
    queryKey: ['pocs', contactId],
    queryFn: () => getPoc(contactId),
  });

  // Mutation to post a new poc
  const mutation = useMutation({
    mutationFn: postPoc,
    onSuccess: () => {
      setDetails('');
      setSaveError('');
      // Refetch notes so the new one appears immediately
      queryClient.invalidateQueries({ queryKey: ['pocs', contactId] });
    },
    onError: (err: Error) => {
      setSaveError(err.message);
    },
  });

  function handleSave() {
    
    if (!session?.user?.username) return;
    if (!session?.user?.email) return;

    setSaveError('');
    mutation.mutate({
      contactId,
      username: session.user.username,
      details: session.user.email,
    });
  }

  return (
    <div className="mt-4">
      

      {/* Add poc form — only shown when authenticated */}
     
        
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            {saveError && (
              <div className="alert alert-danger py-2 small mb-2">{saveError}</div>
            )}
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Click to assign yourself as a PoC
              </small>
              <button
                className="btn btn-primary btn-sm px-4"
                onClick={handleSave}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" />
                    Saving…
                  </>
                ) : (
                  'Add self as poc'
                )}
              </button>
            </div>
          </div>
        </div>

     

      {/* Notes history */}
      {isLoading && (
        <div className="text-center text-muted py-3">
          <span className="spinner-border spinner-border-sm me-2" />
          Loading PoCs…
        </div>
      )}

      {isError && (
        <div className="alert alert-warning py-2 small">
          Could not load PoCs. Please try refreshing.
        </div>
      )}

      {pocs && pocs.length === 0 && (
        <p className="text-muted small">No PoCs yet for this contact.</p>
      )}

      {pocs && pocs.length > 0 && (
        <div>
          {pocs.map((poc) => (
            <PocCard key={poc.pocId} poc={poc}  currentUsername={session?.user.username ?? ''} />
          ))}
        </div>
      )}
    </div>
  );
}
