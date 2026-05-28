'use client';


import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTag, postTag, deleteTag } from '@/libs/api';
import type { ContactTag, Tags} from '@/types/contact';

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
async function getAllTags(): Promise<Tags[]> {
  const res = await fetch('/api/tags', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch tags');
  const json = await res.json();
  return json.data;
}

function TagCard({ 
  tag, 
  currentUsername, 
  onDelete,  
}: { 
  tag: ContactTag; 
  currentUsername: string ; 
  onDelete: (tagId: string) => Promise<void>; }) {
  const isOwner = tag.username === currentUsername;
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');


  async function handleConfirmDelete() {
    setIsDeleting(true);
    setError('');
    try {
      await onDelete(tag.tagId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete PoC');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    
    <div className="col-auto">
      {isOwner && (
        <button className="btn btn-outline-danger btn-sm py-0" 
        title="Delete tag" 
        
        onClick={handleConfirmDelete}
        disabled={isDeleting}
        >
           {isDeleting ? (
                  <><span className="spinner-border spinner-border-sm me-1" role="status" />…</>
                ) : '🗑️'}
          
        </button>
      )}
      <span className="badge bg-primary ms-2 rounded-pill" title={tag.username}>
        {tag.tag}</span>
    </div>
   
  );
}

export default function ContactTags({ contactId }: Props) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [tag, setTag] = useState('');
  const [saveError, setSaveError] = useState('');

  const username = session?.user?.username ?? '';


  const { data: tagsDd} = useQuery<Tags[]>({
      queryKey: ['all-tags'],
      queryFn: getAllTags,
    });


  // Fetch existing notes
  const {
    data: tags,
    isLoading,
    isError,
  } = useQuery<ContactTag[]>({
    queryKey: ['tags', contactId],
    queryFn: () => getTag(contactId),
  });

  // Mutation to post a new note
  const mutation = useMutation({
    mutationFn: postTag,
    onSuccess: () => {
      setTag('');
      setSaveError('');
      // Refetch notes so the new one appears immediately
      queryClient.invalidateQueries({ queryKey: ['tags', contactId] });
    },
    onError: (err: Error) => {
      setSaveError(err.message);
    },
  });

  function handleSave() {
    if (!tag.trim()) return;
    if (!session?.user?.username) return;

    setSaveError('');
    mutation.mutate({
      contactId,
      username: session.user.username,
      tag: tag.trim(),
    });
  }
async function handleDelete(pocId: string) {
    await deleteTag(pocId, username);
    queryClient.invalidateQueries({ queryKey: ['tags', contactId] });
  }

  // Names of areas already assigned to this contact
const assignedNames = new Set((tags ?? []).map((a) => a.tag));

// Available areas = all areas minus the ones already assigned
const availableTags = (tagsDd ?? []).filter(
  (a) => !assignedNames.has(a.tag)
);


  return (
    <div >
        <div className="row py-4"><div className='fw-medium border-bottom'>Tags</div>
      {tags && tags.length > 0 && (
       <>
          {tags.map((tag) => (

            <TagCard key={tag.tagId} tag={tag} currentUsername={session?.user.username ?? ''}  onDelete={handleDelete}/>
          
          ))}
        </>
      )}
</div>
      {/* Add note form — only shown when authenticated */}
      {status === 'authenticated' ? (
        
        <div className="card border-0 shadow mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-left">
                <div className="col-auto">
<label htmlFor="tagName" className="fcol-form-label ">
              Add a tag
            </label>
                </div>
                <div className="col-auto">

                  <select
                  id="tagName"
                  className="form-select form-select-sm shadow-sm"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  disabled={mutation.isPending}
                  >
                    <option value="">Select</option>

                    {availableTags.map((tag) => (
  <option key={tag.Id} value={tag.tag}>{tag.tag}</option>
))}

                     
                  </select>
                
                </div>
                <div className="col-auto">
                     <button
                className="btn btn-primary btn-sm "
                onClick={handleSave}
                disabled={!tag.trim() || mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" />
                    Saving…
                  </>
                ) : (
                  'Save tag'
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
          Please sign in to add tags.
        </div>
      )}

      {/* Notes history */}
      {isLoading && (
        <div className="text-center text-muted py-3">
          <span className="spinner-border spinner-border-sm me-2" />
          Loading tags…
        </div>
      )}

      {isError && (
        <div className="alert alert-warning py-2 small">
          Could not load tags. Please try refreshing.
        </div>
      )}

      {tags && tags.length === 0 && (
        <p className="text-muted small">No tags yet for this contact.</p>
      )}

      
    </div>
  );
}
