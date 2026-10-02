'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllCommunities } from '@/libs/communityPagesApi';
import { createCommunity } from '@/libs/communitiesApi';
import type { CommunityCardData } from '@/types/communityPages';

function CommunityCard({ c }: { c: CommunityCardData }) {
  return (
    <div className="col">
      <Link href={`/communities/${c.communityId}`} className="text-decoration-none text-body">
        <div className={`card h-100 border-0 shadow-sm ${c.isCreator ? 'border-start border-success border-4' : ''}`}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <h6 className="fw-semibold mb-1">🏘️ {c.name}</h6>
              <div className="d-flex gap-1 flex-shrink-0">
                {c.isCreator && <span className="badge bg-success rounded-pill">yours</span>}
                {!c.isCreator && c.isMember && <span className="badge bg-primary rounded-pill">member</span>}
              </div>
            </div>
            {c.description && <p className="text-muted small mb-2">{c.description}</p>}
            <small className="text-muted">
              👥 {c.memberCount} member{c.memberCount !== 1 ? 's' : ''} &middot; created by {c.createdBy}
            </small>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function CommunitiesPage() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const username = session?.user?.username ?? '';
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const { data: communities, isLoading, isError } = useQuery<CommunityCardData[]>({
    queryKey: ['communities-all', username],
    queryFn: () => getAllCommunities(username),
    enabled: !!username,
  });

  async function handleCreate() {
    setBusy(true); setError('');
    try {
      // POST /api/communities now also creates the linked email group
      await createCommunity({ name: name.trim(), description: description.trim(), username });
      setName(''); setDescription(''); setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['communities-all', username] });
      queryClient.invalidateQueries({ queryKey: ['communities', username] });
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create'); }
    finally { setBusy(false); }
  }

  const mine = communities?.filter((c) => c.isCreator) ?? [];
  const others = communities?.filter((c) => !c.isCreator) ?? [];

  return (
    <>
      

      <div className="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-2">
        <div>

          
          <p className="lead">Communities</p>

          <p className="text-muted mb-0">Group contacts and meetings by team, project or topic.</p>
        </div>
        {status === 'authenticated' && !open && (
          <button className="btn btn-primary" onClick={() => setOpen(true)}>+ New community</button>
        )}
      </div>

      {open && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h6 className="fw-semibold mb-2">New community</h6>
            <p className="text-muted small">An email group with the same name is created automatically — add its members from the community page.</p>
            <input className="form-control mb-2" placeholder="Community name *" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} autoFocus />
            <textarea className="form-control mb-2" rows={2} placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} disabled={busy} />
            {error && <div className="alert alert-danger py-1 small mb-2">{error}</div>}
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={!name.trim() || busy}>{busy ? 'Creating…' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {isLoading && <div className="text-center text-muted py-5"><span className="spinner-border" /></div>}
      {isError && <div className="alert alert-warning">Could not load communities.</div>}

      {communities && communities.length === 0 && (
        <div className="text-center text-muted py-5">
          <div style={{ fontSize: '3rem' }}>🏘️</div>
          <p className="mt-2">No communities yet — create the first one above.</p>
        </div>
      )}

      {mine.length > 0 && (
        <>
          <h5 className="fw-semibold mb-3">My communities</h5>
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3 mb-5">
            {mine.map((c) => <CommunityCard key={c.communityId} c={c} />)}
          </div>
        </>
      )}

      {others.length > 0 && (
        <>
          <h5 className="fw-semibold mb-3">All communities</h5>
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
            {others.map((c) => <CommunityCard key={c.communityId} c={c} />)}
          </div>
        </>
      )}
    </>
  );
}
