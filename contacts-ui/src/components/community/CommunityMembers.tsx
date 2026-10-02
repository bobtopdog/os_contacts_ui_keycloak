'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCommunityMembers, addCommunityMember, removeCommunityMember } from '@/libs/communitiesApi';
import UsernameAutocomplete from '@/components/UsernameAutocomplete';
import type { CommunityMember } from '@/types/community';

interface Props { communityId: string; username: string; createdBy: string; isCreator: boolean; onChanged?: () => void; }

/** Member list; only the community owner can add/remove (existing API reused). */
export default function CommunityMembers({ communityId, username, createdBy, isCreator, onChanged }: Props) {
  const queryClient = useQueryClient();
  const [newMember, setNewMember] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const { data: members } = useQuery<CommunityMember[]>({
    queryKey: ['community-members', communityId],
    queryFn: () => getCommunityMembers(communityId),
  });
  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
    onChanged?.();
  }

  async function add() {
    if (!newMember.trim()) return;
    setBusy(true); setError('');
    try { await addCommunityMember(communityId, username, newMember.trim()); setNewMember(''); refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setBusy(false); }
  }
  async function remove(memberId: string) {
    setBusy(true); setError('');
    try { await removeCommunityMember(communityId, memberId, username); setConfirmRemove(null); refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setBusy(false); }
  }

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-bottom py-2">
        <h6 className="fw-semibold mb-0">👥 Members <span className="badge bg-secondary rounded-pill ms-1">{members?.length ?? 0}</span></h6>
      </div>
      <div className="card-body py-2">
        {isCreator && (
          <div className="d-flex gap-2 mb-2">
            <UsernameAutocomplete value={newMember} onChange={setNewMember} placeholder="Add member…" disabled={busy} />
            <button className="btn btn-outline-primary btn-sm" onClick={add} disabled={!newMember.trim() || busy}>Add</button>
          </div>
        )}
        {error && <div className="alert alert-danger py-1 small mb-2">{error}</div>}
        {members?.map((m) => (
          <div key={m.memberId} className="d-flex justify-content-between align-items-center py-1 border-bottom small">
            <span>
              👤 {m.username}
              {m.username === createdBy && <span className="badge bg-success rounded-pill ms-1" style={{ fontSize: '0.6rem' }}>owner</span>}
              {m.username === username && <span className="badge bg-primary rounded-pill ms-1" style={{ fontSize: '0.6rem' }}>you</span>}
            </span>
            {isCreator && m.username !== createdBy && (
              confirmRemove === m.memberId ? (
                <span className="d-flex gap-1">
                  <button className="btn btn-danger btn-sm py-0" onClick={() => remove(m.memberId)} disabled={busy}>Yes</button>
                  <button className="btn btn-outline-secondary btn-sm py-0" onClick={() => setConfirmRemove(null)} disabled={busy}>No</button>
                </span>
              ) : (
                <button className="btn btn-outline-danger btn-sm py-0 px-1" onClick={() => setConfirmRemove(m.memberId)} title="Remove">✕</button>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
