'use client';

import Link from 'next/link';
import { useTeamWeeklyStats } from '@/hooks/useTeamWeeklyStats';
import ContactName from '@/components/ContactName';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

/**
 * The 5 most recent client meetings recorded by team members.
 * Row: date (links to the contact) — title — contact name.
 * Names resolve via the cached ContactName component, so at most five
 * deduplicated lookups against the contacts API.
 */
export default function TeamRecentClientMeetings({ teamId }: { teamId: string }) {
  const { data, isLoading, isError } = useTeamWeeklyStats(teamId);

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-white border-bottom py-2">
        <h6 className="fw-semibold mb-0">🤝 Client meetings</h6>
      </div>
      <div className="card-body py-2">

        {isLoading && (
          <div className="text-center text-muted py-3">
            <span className="spinner-border spinner-border-sm" />
          </div>
        )}

        {isError && !isLoading && (
          <p className="text-muted small mb-0">Could not load recent meetings.</p>
        )}

        {data && data.recentClientMeetings.length === 0 && (
          <p className="text-muted small mb-0">No client meetings recorded yet.</p>
        )}

        {data && data.recentClientMeetings.map((m) => (
          <div key={m.meetingId} className="py-2 border-bottom small">
            <Link
              href={`/contacts/${m.contactId}`}
              className="text-decoration-none fw-medium"
              title="View contact"
            >
              📅 {formatDate(m.meetingDate)}
            </Link>
            {m.title && <span className="ms-2">{m.title}</span>}
            <span className="text-muted ms-2">
              — <ContactName contactId={m.contactId} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
