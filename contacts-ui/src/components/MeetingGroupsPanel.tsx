'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getUserMeetingGroups, createMeetingGroup, renameMeetingGroup, deleteMeetingGroup,
  getMeetingGroupMembers, addMeetingGroupMember, removeMeetingGroupMember,
  setMeetingGroupMemberRole, getGroupCsvUrl,
} from '@/libs/meetingGroupsApi';
import type { MeetingGroup, MeetingGroupMember, GroupRole } from '@/types/meetingGroup';
import UsernameAutocomplete from '@/components/UsernameAutocomplete';
import { duplicateMeetingGroup } from '@/libs/meetingGroupsApi';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Member row — role badge, role toggle (creator only), remove (admins)
// ---------------------------------------------------------------------------
function MemberRow({
  member, group, currentUsername, onRemove, onRoleChange,
}: {
  member: MeetingGroupMember;
  group: MeetingGroup;
  currentUsername: string;
  onRemove: (groupMemberId: string) => Promise<void>;
  onRoleChange: (groupMemberId: string, role: GroupRole) => Promise<void>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const isGroupCreator = member.username === group.createdBy;
  const canManage = group.myRole === 'admin';

  async function handleRemove() {
    setIsBusy(true);
    try {
      await onRemove(member.groupMemberId);
    } catch {
      setIsBusy(false);
      setConfirmDelete(false);
    }
  }

  async function handleToggleRole() {
    setIsBusy(true);
    try {
      await onRoleChange(
        member.groupMemberId,
        member.role === 'admin' ? 'viewer' : 'admin'
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-between py-1 border-bottom">
      {!confirmDelete ? (
        <>
          <div className="d-flex align-items-center gap-2">
            <span>👤</span>
            <span className="small">{member.username}</span>
            {isGroupCreator && (
              <span className="badge bg-success rounded-pill" style={{ fontSize: '0.65rem' }}>
                creator
              </span>
            )}
            <span
              className={`badge rounded-pill ${member.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary'}`}
              style={{ fontSize: '0.65rem' }}
            >
              {member.role}
            </span>
            {member.username === currentUsername && (
              <span className="badge bg-primary rounded-pill" style={{ fontSize: '0.65rem' }}>
                you
              </span>
            )}
          </div>
          <div className="d-flex gap-1">
            {/* Role toggle — creator only (requirement 3), not on the creator's own row */}
            {group.isCreator && !isGroupCreator && (
              <button
                className="btn btn-outline-warning btn-sm py-0 px-1"
                onClick={handleToggleRole}
                disabled={isBusy}
                title={member.role === 'admin' ? 'Demote to viewer' : 'Promote to admin'}
                style={{ fontSize: '0.7rem' }}
              >
                {member.role === 'admin' ? '⬇ viewer' : '⬆ admin'}
              </button>
            )}
            {/* Remove — any admin, but never the creator */}
            {canManage && !isGroupCreator && (
              <button
                className="btn btn-outline-danger btn-sm py-0 px-1"
                onClick={() => setConfirmDelete(true)}
                disabled={isBusy}
                title="Remove member"
                style={{ fontSize: '0.75rem' }}
              >
                ✕
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="d-flex align-items-center gap-2 small text-danger">
          <span>Remove {member.username}?</span>
          <button className="btn btn-danger btn-sm py-0" onClick={handleRemove} disabled={isBusy}>
            Yes
          </button>
          <button
            className="btn btn-outline-secondary btn-sm py-0"
            onClick={() => setConfirmDelete(false)}
            disabled={isBusy}
          >
            No
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single group card — rename, manage members, add member with role, CSV
// ---------------------------------------------------------------------------
function GroupCard({
  group, currentUsername, onRefresh,
}: {
  group: MeetingGroup;
  currentUsername: string;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(group.name);
  const [newMember, setNewMember] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<GroupRole>('viewer');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = group.myRole === 'admin';

  const { data: members, refetch } = useQuery<MeetingGroupMember[]>({
    queryKey: ['meeting-group-members', group.groupId],
    queryFn: () => getMeetingGroupMembers(group.groupId),
    enabled: expanded,
  });

  async function run(action: () => Promise<void>) {
    setIsBusy(true);
    setError('');
    try {
      await action();
      refetch();
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRename() {
    if (!renameValue.trim() || renameValue.trim() === group.name) {
      setIsRenaming(false);
      return;
    }
    await run(async () => {
      await renameMeetingGroup(group.groupId, currentUsername, renameValue.trim());
      setIsRenaming(false);
    });
  }

  async function handleAddMember() {
    if (!newMember.trim()) return;
    await run(async () => {
      await addMeetingGroupMember(group.groupId, currentUsername, newMember.trim(), newMemberRole);
      setNewMember('');
      setNewMemberRole('viewer');
    });
  }

  async function handleRemoveMember(groupMemberId: string) {
    await run(() => removeMeetingGroupMember(group.groupId, groupMemberId, currentUsername));
  }

  async function handleRoleChange(groupMemberId: string, role: GroupRole) {
    await run(() => setMeetingGroupMemberRole(group.groupId, groupMemberId, currentUsername, role));
  }

  async function handleDelete() {
    await run(() => deleteMeetingGroup(group.groupId, currentUsername));
  }

  const [isDuplicating, setIsDuplicating] = useState(false);

    async function handleDuplicate() {
      setIsDuplicating(true);
      try {
        await duplicateMeetingGroup(group.groupId, currentUsername);
        onRefresh();   // the copy appears in the list, named "Copy of X"
      } finally {
        setIsDuplicating(false);
      }
    }

  return (
    <div className="card border-0 bg-light mb-3">
      <div className="card-body py-2 px-3">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start">
          <div className="overflow-hidden">
            {!isRenaming ? (
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '1.1rem' }}>📅</span>
                <span className="fw-semibold">{group.name}</span>
                <span
                  className={`badge rounded-pill ${isAdmin ? 'bg-warning text-dark' : 'bg-secondary'}`}
                  style={{ fontSize: '0.65rem' }}
                >
                  {group.myRole}
                </span>
                {group.isCreator && (
                  <span className="badge bg-success rounded-pill" style={{ fontSize: '0.65rem' }}>
                    yours
                  </span>
                )}
              </div>
            ) : (
              <div className="d-flex gap-2 align-items-center">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  disabled={isBusy}
                  autoFocus
                />
                <button className="btn btn-primary btn-sm py-0" onClick={handleRename} disabled={isBusy}>
                  ✓
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm py-0"
                  onClick={() => { setRenameValue(group.name); setIsRenaming(false); }}
                  disabled={isBusy}
                >
                  ✕
                </button>
              </div>
            )}
            <small className="text-muted">
              {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
              {' '}&middot; created {formatDate(group.createdAt)}
            </small>
          </div>

          {!isRenaming && (
            <div className="d-flex gap-1 flex-shrink-0">
              {/* CSV download — requirement 6, any group member */}
              <a
                href={getGroupCsvUrl(group.groupId, currentUsername)}
                className="btn btn-outline-success btn-sm py-0"
                title="Download member list as CSV"
                download
              >
                📥 CSV
              </a>
              {isAdmin && (
                <button
                  className="btn btn-outline-secondary btn-sm py-0"
                  onClick={() => setIsRenaming(true)}
                  title="Rename group"
                >
                  ✏️
                </button>
              )}
              <button
                className="btn btn-outline-secondary btn-sm py-0"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? 'Hide' : 'Manage'}
              </button>
              {group.isCreator && (
                <button
                  className="btn btn-outline-danger btn-sm py-0"
                  onClick={() => setConfirmDelete(true)}
                  title="Delete group"
                >
                  🗑️
                </button>

                
              )}
              <button
      className="btn btn-outline-secondary btn-sm py-0"
      onClick={handleDuplicate}
      disabled={isDuplicating}
      title="Duplicate group and members"
    >
      {isDuplicating ? '…' : '📋'}
    </button>
            </div>
          )}
        </div>

        {error && <div className="alert alert-danger py-1 small mt-2 mb-0">{error}</div>}

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="alert alert-danger py-2 small mt-2 mb-0">
            Delete <strong>{group.name}</strong> and all its meeting tags? This cannot be undone.
            <div className="d-flex justify-content-end gap-2 mt-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setConfirmDelete(false)}
                disabled={isBusy}
              >
                Cancel
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={isBusy}>
                {isBusy ? 'Deleting…' : 'Yes, delete'}
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
                key={m.groupMemberId}
                member={m}
                group={group}
                currentUsername={currentUsername}
                onRemove={handleRemoveMember}
                onRoleChange={handleRoleChange}
              />
            ))}

            {/* Add member with role — admins only (requirement 2 & 3) */}
            {isAdmin && (
              <div className="mt-2">
                <div className="d-flex gap-2">
                  <UsernameAutocomplete
                    value={newMember}
                    onChange={setNewMember}
                    placeholder="Username to add…"
                    disabled={isBusy}
                  />
                  <select
                    className="form-select form-select-sm"
                    style={{ maxWidth: '110px' }}
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as GroupRole)}
                    disabled={isBusy}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={handleAddMember}
                    disabled={!newMember.trim() || isBusy}
                  >
                    {isBusy ? '…' : 'Add'}
                  </button>
                </div>
                <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                  Admins will be alerted by email when the group changes.
                </small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create group form
// ---------------------------------------------------------------------------
function CreateGroupForm({
  username, onCreated,
}: {
  username: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setIsSaving(true);
    setError('');
    try {
      await createMeetingGroup(name.trim(), username);
      setName('');
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
        + Create new meeting group
      </button>
    );
  }

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body">
        <h6 className="fw-semibold mb-2">New meeting group</h6>
        <input
          type="text"
          className="form-control form-control-sm mb-2"
          placeholder="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSaving}
          autoFocus
        />
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
// Main MeetingGroupsPanel — drop into an offcanvas like the Communities panel
// ---------------------------------------------------------------------------
export default function MeetingGroupsPanel() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const username = session?.user?.username ?? '';

  const { data: groups, isLoading, isError } = useQuery<MeetingGroup[]>({
    queryKey: ['meeting-groups', username],
    queryFn: () => getUserMeetingGroups(username),
    enabled: !!username,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['meeting-groups', username] });
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
        Meeting groups let you tag contact meetings and notify everyone in the
        group by email. Admins manage members; viewers can see the group and
        download the member list.
      </p>

      <CreateGroupForm username={username} onCreated={refresh} />

      {isLoading && (
        <div className="text-center text-muted py-3">
          <span className="spinner-border spinner-border-sm me-2" />Loading…
        </div>
      )}

      {isError && (
        <div className="alert alert-warning py-2 small">Could not load meeting groups.</div>
      )}

      {groups && groups.length === 0 && (
        <p className="text-muted small text-center py-3">
          You are not in any meeting groups yet. Create one above to get started!
        </p>
      )}

      {groups?.map((group) => (
        <GroupCard
          key={group.groupId}
          group={group}
          currentUsername={username}
          onRefresh={refresh}
        />
      ))}
    </>
  );
}
