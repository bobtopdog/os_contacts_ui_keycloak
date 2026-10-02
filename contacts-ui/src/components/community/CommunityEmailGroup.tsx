'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMeetingGroupMembers, addMeetingGroupMember, removeMeetingGroupMember, setMeetingGroupMemberRole,
} from '@/libs/meetingGroupsApi';
import UsernameAutocomplete from '@/components/UsernameAutocomplete';
import type { MeetingGroupMember } from '@/types/meetingGroup';

interface Props {
  groupId: string; groupName: string;
  username: string; communityCreator: string; isCreator: boolean;
}

/**
 * The community's one linked email group. Reuses the existing meeting-group
 * member APIs (admins add/remove; only the creator toggles admin). Members
 * are emailed whenever a meeting is tagged with this community.
 */
export default function CommunityEmailGroup({ groupId, groupName, username, communityCreator, isCreator }: Props) {
  const queryClient = useQueryClient();
  const [newMember, setNewMember] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const { data: members } = useQuery<MeetingGroupMember[]>({
    queryKey: ['meeting-group-members', groupId],
    queryFn: () => getMeetingGroupMembers(groupId),
  });
  const me = members?.find((m) => m.username === username);
  const isAdmin = me?.role === 'admin';
  function refresh() { queryClient.invalidateQueries({ queryKey: ['meeting-group-members', groupId] }); }

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setError('');
    try { await fn(); refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setBusy(false); }
  }

  const csvUrl = `${process.env.NEXT_PUBLIC_NOTES_API_URL ?? 'http://localhost:3000'}/api/meeting-groups/${groupId}/csv?username=${encodeURIComponent(username)}`;

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
        <h6 className="fw-semibold mb-0">📧 Email group <span className="text-muted fw-normal small">— {groupName}</span></h6>
        {me && <a className="btn btn-outline-secondary btn-sm py-0" href={csvUrl}>⬇️ CSV</a>}
      </div>
      <div className="card-body py-2">
        <p className="text-muted small mb-2">Members are emailed whenever a meeting is tagged with this community.</p>
        {isAdmin && (
          <div className="d-flex gap-2 mb-2">
            <UsernameAutocomplete value={newMember} onChange={setNewMember} placeholder="Add to email group…" disabled={busy} />
            <button className="btn btn-outline-primary btn-sm"
              onClick={() => run(async () => { await addMeetingGroupMember(groupId, username, newMember.trim()); setNewMember(''); })}
              disabled={!newMember.trim() || busy}>Add</button>
          </div>
        )}
        {error && <div className="alert alert-danger py-1 small mb-2">{error}</div>}
        {members && members.length === 0 && <p className="text-muted small mb-0">No members yet.</p>}
        {members?.map((m) => (
          <div key={m.memberId} className="d-flex justify-content-between align-items-center py-1 border-bottom small">
            <span>
              👤 {m.username}
              <span className={`badge rounded-pill ms-1 ${m.role === 'admin' ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '0.6rem' }}>{m.role}</span>
              {m.username === username && <span className="badge bg-primary rounded-pill ms-1" style={{ fontSize: '0.6rem' }}>you</span>}
            </span>
            {m.username !== communityCreator && (
              <span className="d-flex gap-1">
                {isCreator && (
                  <button className="btn btn-outline-secondary btn-sm py-0" disabled={busy}
                    onClick={() => run(() => setMeetingGroupMemberRole(groupId, m.memberId, username, m.role === 'admin' ? 'viewer' : 'admin'))}>
                    {m.role === 'admin' ? 'Make viewer' : 'Make admin'}
                  </button>
                )}
                {isAdmin && (
                  <button className="btn btn-outline-danger btn-sm py-0 px-1" disabled={busy}
                    onClick={() => run(() => removeMeetingGroupMember(groupId, m.memberId, username))}>✕</button>
                )}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
