'use client';

import Link from 'next/link';
import { useTeamWeeklyStats } from '@/hooks/useTeamWeeklyStats';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function truncate(text: string, max = 90) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/**
 * 4. Overview of client notes entered this week —
 *    total count plus the latest five as a preview feed.
 */
export default function TeamNotesOverview({ teamId }: { teamId: string }) {
  const { data, isLoading, isError } = useTeamWeeklyStats(teamId);

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
        <h6 className="fw-semibold mb-0">📝 Notes this week</h6>
        {data && (
          <span className="badge bg-primary rounded-pill">{data.notesCount}</span>
        )}
      </div>
      <div className="card-body py-2">

        {isLoading && (
          <div className="text-center text-muted py-3">
            <span className="spinner-border spinner-border-sm" />
          </div>
        )}

        {isError && !isLoading && (
          <p className="text-muted small mb-0">Could not load notes overview.</p>
        )}

        {data && data.recentNotes.length === 0 && (
          <p className="text-muted small mb-0">No notes entered this week.</p>
        )}

        {data && data.recentNotes.map((note) => (
          <div key={note.noteId} className="py-2 border-bottom">
            <Link
              href={`/contacts/${note.contactId}`}
              className="text-decoration-none"
            >
              <p className="mb-1 small text-body">{truncate(note.comment)}</p>
            </Link>
            <small className="text-muted" style={{ fontSize: '0.7rem' }}>
              👤 <strong>{note.username}</strong> &middot; {formatDate(note.createdAt)}
            </small>
          </div>
        ))}

        {data && data.notesCount > data.recentNotes.length && (
          <p className="text-muted text-center mb-0 mt-2" style={{ fontSize: '0.7rem' }}>
            Showing latest {data.recentNotes.length} of {data.notesCount}
          </p>
        )}
      </div>
    </div>
  );
}
