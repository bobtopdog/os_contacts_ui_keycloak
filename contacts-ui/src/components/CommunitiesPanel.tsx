'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserCommunities, createCommunity, deleteCommunity,
  getCommunityMembers, addCommunityMember, removeCommunityMember,
} from '@/libs/communitiesApi';
import type { Community, CommunityMember } from '@/types/community';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UsernameAutocomplete from '@/components/UsernameAutocomplete';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Member row
// ---------------------------------------------------------------------------
function MemberRow({
  member, isCreator, currentUsername, communityCreator, onRemove,
}: {
  member: CommunityMember;
  isCreator: boolean;
  currentUsername: string;
  communityCreator: string;
  onRemove: (memberId: string) => Promise<void>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const isCommunityCreator = member.username === communityCreator;

  async function handleRemove() {
    setIsRemoving(true);
    try {
      await onRemove(member.memberId);
    } catch {
      setIsRemoving(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-between py-1 border-bottom">
      {!confirmDelete ? (
        <>
          <div className="d-flex align-items-center gap-2">
            <span>👤</span>
            <span className="small">{member.username}</span>
            {isCommunityCreator && (
              <span className="badge bg-success rounded-pill" style={{ fontSize: '0.65rem' }}>
                creator
              </span>
            )}
            {member.username === currentUsername && (
              <span className="badge bg-primary rounded-pill" style={{ fontSize: '0.65rem' }}>
                you
              </span>
            )}
          </div>
          {/* Only the creator can remove other members */}
          {isCreator && !isCommunityCreator && (
            <button
              className="btn btn-outline-danger btn-sm py-0 px-1"
              onClick={() => setConfirmDelete(true)}
              title="Remove member"
              style={{ fontSize: '0.75rem' }}
            >
              ✕
            </button>
          )}
        </>
      ) : (
        <div className="d-flex align-items-center gap-2 small text-danger">
          <span>Remove {member.username}?</span>
          <button
            className="btn btn-danger btn-sm py-0"
            onClick={handleRemove}
            disabled={isRemoving}
          >
            Yes
          </button>
          <button
            className="btn btn-outline-secondary btn-sm py-0"
            onClick={() => setConfirmDelete(false)}
            disabled={isRemoving}
          >
            No
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single community card with member list and add member form
// ---------------------------------------------------------------------------
function CommunityCard({
  community, currentUsername, onRefresh,
}: {
  community: Community;
  currentUsername: string;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [newMember, setNewMember] = useState('');
  const [memberError, setMemberError] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: members, refetch } = useQuery<CommunityMember[]>({
    queryKey: ['community-members', community.communityId],
    queryFn: () => getCommunityMembers(community.communityId),
    enabled: expanded,
  });

  async function handleAddMember() {
    if (!newMember.trim()) return;
    setIsAddingMember(true);
    setMemberError('');
    try {
      await addCommunityMember(community.communityId, currentUsername, newMember.trim());
      setNewMember('');
      refetch();
      onRefresh();
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    await removeCommunityMember(community.communityId, memberId, currentUsername);
    refetch();
    onRefresh();
  }

  async function handleDeleteCommunity() {
    setIsDeleting(true);
    try {
      await deleteCommunity(community.communityId, currentUsername);
      onRefresh();
    } catch {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }
  const router = useRouter();
  function handleClick(e: React.MouseEvent) {
    e.preventDefault();

    // Close the offcanvas first
    const offcanvasEl = document.getElementById('offcanvasExample');
    if (offcanvasEl && typeof window !== 'undefined') {
      // @ts-expect-error - bootstrap is loaded globally
      const offcanvas = window.bootstrap?.Offcanvas?.getInstance(offcanvasEl);
      offcanvas?.hide();
    }

    // Then navigate data-bs-dismiss="offcanvas"
    router.push(`/communities/${community.communityId}`);
  }
  return (
    <div className="card border-0 bg-light mb-3">
      <div className="card-body py-2 px-3">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start">
          <div className="overflow-hidden">
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '1.1rem' }}>🏘️</span>
              <span className="fw-semibold">{community.name}</span>
              {community.isCreator && (
                <span className="badge bg-success rounded-pill" style={{ fontSize: '0.65rem' }}>
                  yours
                </span>
              )}
            </div>
            {community.description && (
              <small className="text-muted d-block mt-1">{community.description}</small>
            )}
            <small className="text-muted">
              {community.memberCount} member{community.memberCount !== 1 ? 's' : ''}
              {' '}&middot; created {formatDate(community.createdAt)}
            </small>
          </div>
          <div className="d-flex gap-1">
            <button
              className="btn btn-outline-secondary btn-sm py-0"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? 'Hide' : 'Manage'}
            </button>
            {community.isCreator && (
              <button
                className="btn btn-outline-danger btn-sm py-0"
                onClick={() => setConfirmDelete(true)}
                title="Delete community"
              >
                🗑️
              </button>



            )}


            <a
              href={`/communities/${community.communityId}`}
              onClick={handleClick}
              className="btn btn-outline-primary btn-sm py-0 " data-bs-dismiss="offcanvas"
            >
              📇 Contacts
            </a>
          </div>
        </div>

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="alert alert-danger py-2 small mt-2 mb-0">
            Delete <strong>{community.name}</strong> and all its tags? This cannot be undone.
            <div className="d-flex justify-content-end gap-2 mt-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDeleteCommunity}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        )}

        {/* Expanded members view */}
        {expanded && !confirmDelete && (
          <div className="mt-2 pt-2 border-top">
            <div className="text-muted small fw-medium mb-1">Members</div>
            {members?.map((m) => (
              <MemberRow
                key={m.memberId}
                member={m}
                isCreator={community.isCreator}
                currentUsername={currentUsername}
                communityCreator={community.createdBy}
                onRemove={handleRemoveMember}
              />
            ))}

            {/* Add member — only creator */}
            {community.isCreator && (
              <div className="mt-2">
                <div className="d-flex gap-2">

                  <UsernameAutocomplete
                    value={newMember}
                    onChange={setNewMember}
                    placeholder="Username to add…"
                    disabled={isAddingMember}
                  />
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={handleAddMember}
                    disabled={!newMember.trim() || isAddingMember}
                  >
                    {isAddingMember ? '…' : 'Add'}
                  </button>
                </div>
                {memberError && (
                  <div className="alert alert-danger py-1 small mt-2 mb-0">{memberError}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create community form
// ---------------------------------------------------------------------------
function CreateCommunityForm({
  username, onCreated,
}: {
  username: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setIsSaving(true);
    setError('');
    try {
      await createCommunity({ name: name.trim(), description: description.trim(), username });
      setName('');
      setDescription('');
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setIsSaving(false);
    }
  }

  if (!open) {
    return (
      <button className="btn btn-primary btn-sm w-100 mb-3" onClick={() => setOpen(true)}>
        + Create new community
      </button>
    );
  }

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body">
        <h6 className="fw-semibold mb-2">New community</h6>
        <div className="mb-2">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Community name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <div className="mb-2">
          <textarea
            className="form-control form-control-sm"
            rows={2}
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSaving}
          />
        </div>
        {error && <div className="alert alert-danger py-1 small mb-2">{error}</div>}
        <div className="d-flex justify-content-end gap-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => { setOpen(false); setError(''); }}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleCreate}
            disabled={!name.trim() || isSaving}
          >
            {isSaving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main CommunitiesPanel
// ---------------------------------------------------------------------------
export default function CommunitiesPanel() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const username = session?.user?.username ?? '';

  const { data: communities, isLoading, isError } = useQuery<Community[]>({
    queryKey: ['communities', username],
    queryFn: () => getUserCommunities(username),
    enabled: !!username,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['communities', username] });
  }

  if (status === 'loading') {
    return (
      <div className="text-center py-3">
        <span className="spinner-border spinner-border-sm" />
      </div>
    );
  }

  if (!session) {
    return <div className="alert alert-warning">Please sign in.</div>;
  }

  return (
    <>
      <p className="text-muted small mb-3">
        Communities let you group contacts by team, project or topic. Tag any contact
        with a community you belong to.
      </p>

      <CreateCommunityForm username={username} onCreated={refresh} />

      {isLoading && (
        <div className="text-center text-muted py-3">
          <span className="spinner-border spinner-border-sm me-2" />Loading…
        </div>
      )}

      {isError && (
        <div className="alert alert-warning py-2 small">Could not load communities.</div>
      )}

      {communities && communities.length === 0 && (
        <p className="text-muted small text-center py-3">
          You are not in any communities yet. Create one above to get started!
        </p>
      )}

      {communities?.map((community) => (
        <CommunityCard
          key={community.communityId}
          community={community}
          currentUsername={username}
          onRefresh={refresh}
        />
      ))}
    </>
  );
}
