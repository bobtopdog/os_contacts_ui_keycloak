'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getUserSummary } from '@/libs/userProfileApi';
import { useDirectoryUser, displayName } from '@/hooks/useDirectoryUser';
import ContactName from '@/components/ContactName';
import type { UserSummary, RecentActivityItem } from '@/types/userProfile';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ActivityRow({ icon, label, item }: { icon: string; label: string; item: RecentActivityItem | null }) {
  return (
    <div className="d-flex gap-2 py-2 border-bottom small">
      <span style={{ width: '1.4rem' }}>{icon}</span>
      <div className="flex-grow-1 overflow-hidden">
        <div className="text-muted" style={{ fontSize: '0.7rem' }}>{label}</div>
        {item ? (
          <>
            <Link href={`/contacts/${item.contactId}`} className="text-decoration-none d-block text-truncate">{item.label}</Link>
            <span className="text-muted" style={{ fontSize: '0.7rem' }}>
              <ContactName contactId={item.contactId} /> &middot; {formatDate(item.createdAt)}
            </span>
          </>
        ) : <span className="text-muted fst-italic">None yet</span>}
      </div>
    </div>
  );
}

function UserSummaryModal({ username, onClose }: { username: string; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery<UserSummary>({
    queryKey: ['user-summary', username],
    queryFn: () => getUserSummary(username),
    staleTime: 60_000,
  });
  const { data: dir } = useDirectoryUser(username);
  const name = displayName(dir, username);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true" onClick={onClose}>
        <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content border-0 shadow">

            {/* Header — real name, with the username beneath for disambiguation */}
            <div className="modal-header bg-secondary text-white align-items-start">
              <div>
                <h5 className="modal-title fw-bold mb-0">👤 {name}</h5>
                {dir?.found && <small className="opacity-75">@{username}</small>}
              </div>
              <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={onClose} />
            </div>

            {/* Directory contact strip */}
            {dir?.found && (dir.email || dir.telephoneNumber) && (
              <div className="px-3 py-2 bg-light border-bottom small d-flex flex-wrap gap-3">
                {dir.email && (
                  <a href={`mailto:${dir.email}`} className="text-decoration-none">✉️ {dir.email}</a>
                )}
                {dir.telephoneNumber && (
                  <a href={`tel:${dir.telephoneNumber.replace(/\s+/g, '')}`} className="text-decoration-none">📞 {dir.telephoneNumber}</a>
                )}
              </div>
            )}

            <div className="modal-body">
              {isLoading && <div className="text-center py-3"><span className="spinner-border spinner-border-sm text-muted" /></div>}
              {isError && <div className="alert alert-warning py-2 small mb-0">Could not load this user's summary.</div>}

              {data && (
                <>
                  <div className="text-muted small fw-medium mb-1">About</div>
                  {data.aboutMe
                    ? <p className="small mb-3" style={{ whiteSpace: 'pre-wrap' }}>{data.aboutMe}</p>
                    : <p className="text-muted small fst-italic mb-3">This user hasn't added anything about themselves yet.</p>}

                  <div className="text-muted small fw-medium mb-1">
                    ⭐ Point of contact for
                    <span className="badge bg-secondary rounded-pill ms-1">{data.pocContactIds.length}</span>
                  </div>
                  {data.pocContactIds.length === 0
                    ? <p className="text-muted small fst-italic mb-3">No contacts.</p>
                    : (
                      <div className="d-flex flex-wrap gap-1 mb-3">
                        {data.pocContactIds.map((id) => (
                          <Link key={id} href={`/contacts/${id}`} className="badge bg-warning text-dark rounded-pill text-decoration-none">
                            <ContactName contactId={id} />
                          </Link>
                        ))}
                      </div>
                    )}

                  <div className="text-muted small fw-medium mb-1">Most recent activity</div>
                  <ActivityRow icon="📝" label="Latest note" item={data.recent.note} />
                  <ActivityRow icon="🤝" label="Latest meeting" item={data.recent.meeting} />
                  <ActivityRow icon="📎" label="Latest document" item={data.recent.document} />
                </>
              )}
            </div>
            <div className="modal-footer py-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Clickable name that opens the user summary modal. Shows the person's real
 * name from the corporate directory (falls back to the username), with the
 * username as a hover tooltip.
 *
 *   <UserSummaryLink username={member.username} />
 *   <UserSummaryLink username={member.username} showUsername />   // "John Smith (smithj1)"
 */
export default function UserSummaryLink({
  username, className = '', showUsername = false,
}: { username: string; className?: string; showUsername?: boolean }) {
  const [open, setOpen] = useState(false);
  const { data: dir } = useDirectoryUser(username);
  const name = displayName(dir, username);
  const known = dir?.found && name !== username;

  return (
    <>
      <button
        type="button"
        className={`btn btn-link p-0 text-decoration-none align-baseline ${className}`}
        onClick={() => setOpen(true)}
        title={known ? `${username} — click for details` : `About ${username}`}
      >
        {name}
        {showUsername && known && <span className="text-muted ms-1 small">({username})</span>}
      </button>
      {open && <UserSummaryModal username={username} onClose={() => setOpen(false)} />}
    </>
  );
}
