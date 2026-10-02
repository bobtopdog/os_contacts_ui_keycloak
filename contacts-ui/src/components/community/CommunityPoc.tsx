'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCommunityPocs, setCommunityPoc } from '@/libs/communityPagesApi';
import type { CommunityPoc as Poc } from '@/types/communityPages';

interface Props { communityId: string; username: string; isMember: boolean; }

/** Point-of-contact list; members can mark/unmark themselves (contact_poc pattern). */
export default function CommunityPoc({ communityId, username, isMember }: Props) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const { data: pocs } = useQuery<Poc[]>({
    queryKey: ['community-poc', communityId],
    queryFn: () => getCommunityPocs(communityId),
  });

  const iAmPoc = pocs?.some((p) => p.username === username) ?? false;

  async function toggle() {
    setBusy(true); setError('');
    try {
      await setCommunityPoc(communityId, username, !iAmPoc);
      queryClient.invalidateQueries({ queryKey: ['community-poc', communityId] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally { setBusy(false); }
  }

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
        <h6 className="fw-semibold mb-0">⭐ Points of contact</h6>
        {isMember && (
          <button className={`btn btn-sm ${iAmPoc ? 'btn-outline-danger' : 'btn-outline-primary'}`}
            onClick={toggle} disabled={busy}>
            {busy ? '…' : iAmPoc ? 'Remove me as PoC' : 'I am a PoC'}
          </button>
        )}
      </div>
      <div className="card-body py-2">
        {error && <div className="alert alert-danger py-1 small mb-2">{error}</div>}
        {pocs && pocs.length === 0 && <p className="text-muted small mb-0">No points of contact yet.</p>}
        {pocs && pocs.length > 0 && (
          <div className="d-flex flex-wrap gap-2">
            {pocs.map((p) => (
              <span key={p.pocId} className="badge bg-warning text-dark rounded-pill">
                👤 {p.username}{p.username === username && ' (you)'}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
