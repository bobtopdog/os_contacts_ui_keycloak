'use client';


import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getArea, postArea, deleteArea } from '@/libs/api';
import type { ContactArea, Areas } from '@/types/contact';

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
async function getAllAreas(): Promise<Areas[]> {
  const res = await fetch('/api/areas', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch areas');
  const json = await res.json();
  return json.data;
}

function AreaCard({
  area,
  currentUsername,
  onDelete,
}: {
  area: ContactArea;
  currentUsername: string;
  onDelete: (areaId: string) => Promise<void>;
}) {
  const isOwner = area.username === currentUsername;
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');


  async function handleConfirmDelete() {
    setIsDeleting(true);
    setError('');
    try {
      await onDelete(area.areaId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete area');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (

    <div className="col-auto">
      {isOwner && (
        <button className="btn btn-outline-danger btn-sm py-0"
          title="Delete area"

          onClick={handleConfirmDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <><span className="spinner-border spinner-border-sm me-1" role="status" />…</>
          ) : '🗑️'}

        </button>
      )}
      <span className="badge bg-primary ms-2 rounded-pill" title={area.username}>
        {area.area}</span>
    </div>

  );
}

export default function ContactAreas({ contactId }: Props) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [area, setArea] = useState('');
  const [saveError, setSaveError] = useState('');

  const username = session?.user?.username ?? '';


  const { data: areasDd } = useQuery<Areas[]>({
    queryKey: ['all-areas'],
    queryFn: getAllAreas,
  });




  // Fetch existing areas
  const {
    data: areas,
    isLoading,
    isError,
  } = useQuery<ContactArea[]>({
    queryKey: ['areas', contactId],
    queryFn: () => getArea(contactId),
  });

  // Mutation to post a new area
  const mutation = useMutation({
    mutationFn: postArea,
    onSuccess: () => {
      setArea('');
      setSaveError('');
      // Refetch area so the new one appears immediately
      queryClient.invalidateQueries({ queryKey: ['areas', contactId] });
    },
    onError: (err: Error) => {
      setSaveError(err.message);
    },
  });

  function handleSave() {
    if (!area.trim()) return;
    if (!session?.user?.username) return;

    setSaveError('');
    mutation.mutate({
      contactId,
      username: session.user.username,
      area: area.trim(),
    });
  }
  async function handleDelete(areaId: string) {
    await deleteArea(areaId, username);
    queryClient.invalidateQueries({ queryKey: ['areas', contactId] });
  }

  // Names of areas already assigned to this contact
  const assignedNames = new Set((areas ?? []).map((a) => a.area));

  // Available areas = all areas minus the ones already assigned
  const availableAreas = (areasDd ?? []).filter(
    (a) => !assignedNames.has(a.area)
  );


  return (
    <div >
      <div className={`card border-1 mb-1 `}>
        <div className="card-header text-muted small">
          <div>Understanding&nbsp;
            <button type="button" className="btn btn-sm btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#areaModal">
              +
            </button>
          </div>
        </div>
        <div className="card-body py-2 px-3">
          {areas && areas.length > 0 && (
            <div className="row py-2">
              {areas.map((area) => (

                <AreaCard key={area.areaId} area={area} currentUsername={session?.user.username ?? ''} onDelete={handleDelete} />

              ))}
            </div>
          )}
        </div>
      </div>
      {/* Add area form — only shown when authenticated */}
      <div className="modal fade" id="areaModal" data-bs-backdrop="static" tabIndex={-1} aria-labelledby="areaModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="areaModalLabel">Understanding</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {status === 'authenticated' ? (

                <div className="card border-1 shadow mb-4">
                  <div className="card-body">
                    <div className="row g-3 align-items-left">
                      <div className="col-auto">
                        <label htmlFor="areaName" className="fcol-form-label ">
                          Add 
                        </label>
                      </div>
                      <div className="col-auto">

                        <select
                          id="areaName"
                          className="form-select form-select-sm shadow-sm"
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          disabled={mutation.isPending}
                        >
                          <option value="">Select</option>

                          {availableAreas.map((area) => (
                            <option key={area.Id} value={area.area}>{area.area}</option>
                          ))}



                        </select>

                      </div>
                      <div className="col-auto">
                        <button
                          className="btn btn-primary btn-sm "
                          onClick={handleSave}
                          disabled={!area.trim() || mutation.isPending}
                        >
                          {mutation.isPending ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" role="status" />
                              Saving…
                            </>
                          ) : (
                            'Save'
                          )}
                        </button>
                      </div>

                    </div>





                    {saveError && (
                      <div className="alert alert-danger py-2 small mb-2">{saveError}</div>
                    )}

                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        Saving as <strong>{session.user.username}</strong>
                      </small>

                    </div>
                  </div>
                </div>
              ) : (
                <div className="alert alert-info py-2 small mb-4">
                  Please sign in to add understanding.
                </div>
              )}

              {/* Understanding history */}
              {isLoading && (
                <div className="text-center text-muted py-3">
                  <span className="spinner-border spinner-border-sm me-2" />
                  Loading understanding…
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>


      {isError && (
        <div className="alert alert-warning py-2 small">
          Could not load understanding. Please try refreshing.
        </div>
      )}

      {areas && areas.length === 0 && (
        <p className="text-muted small">No understanding yet for this contact.</p>
      )}


    </div>
  );
}
