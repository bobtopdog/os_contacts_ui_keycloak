'use client';

import Link from 'next/link';
import { useTeamWeeklyStats } from '@/hooks/useTeamWeeklyStats';

import MinisterName from '../MinisterName';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}


/**
 * The 5 most recent minister meetings recorded by team members.
 * Row: date (links to the minister) — title — minister name.
 *
 * ⚠️ Adjust the href below if your minister detail route differs
 * from /ministers/:id.
 */
export default function TeamRecentMinisterMeetings({ teamId }: { teamId: string }) {
  const { data, isLoading, isError } = useTeamWeeklyStats(teamId);

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-white border-bottom py-2">
        <h6 className="fw-semibold mb-0">🏛️ Minister meetings</h6>
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

        {data && data.recentMinisterMeetings.length === 0 && (
          <p className="text-muted small mb-0">No minister meetings recorded yet.</p>
        )}

        {data && data.recentMinisterMeetings.map((m) => (
          <div key={m.meetingId} className="py-2 border-bottom small">
            <Link
              href={`/ministers/members/${m.ministerId}`}
              className="text-decoration-none fw-medium"
              title="View minister"
            >
              📅 {formatDate(m.meetingDate)}
            </Link>
            {m.title && <span className="ms-2">{m.title}</span>}
            <span className="text-muted ms-2">
              — <MinisterName ministerId={m.ministerId} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
