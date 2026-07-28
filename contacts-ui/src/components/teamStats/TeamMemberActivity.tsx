'use client';

import { useTeamWeeklyStats } from '@/hooks/useTeamWeeklyStats';

/**
 * 2. Activity of team members over the week —
 *    per-member breakdown across notes, meetings, links and documents.
 */
export default function TeamMemberActivity({ teamId }: { teamId: string }) {
  const { data, isLoading, isError } = useTeamWeeklyStats(teamId);

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
        <h6 className="fw-semibold mb-0">📊 Member activity this week</h6>
        {data && (
          <small className="text-muted">{data.weekStart} → {data.weekEnd}</small>
        )}
      </div>
      <div className="card-body p-0">

        {isLoading && (
          <div className="text-center text-muted py-4">
            <span className="spinner-border spinner-border-sm" />
          </div>
        )}

        {isError && !isLoading && (
          <p className="text-muted small p-3 mb-0">Could not load member activity.</p>
        )}

        {data && data.memberActivity.length === 0 && (
          <p className="text-muted small p-3 mb-0">No members in this team.</p>
        )}

        {data && data.memberActivity.length > 0 && (
          <div className="table-responsive">
            <table className="table table-sm table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="ps-3">Member</th>
                  <th className="text-center text-sm">Notes</th>
                  <th className="text-center">Client mtgs</th>
                  <th className="text-center">Minister mtgs</th>
                  <th className="text-center">Links</th>
                  <th className="text-center">Docs</th>
                  <th className="text-center pe-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.memberActivity.map((m) => (
                  <tr key={m.username} className={m.total === 0 ? 'text-muted' : ''}>
                    <td className="ps-3 fw-medium small">👤 {m.username}</td>
                    <td className="text-center small">{m.notes || '–'}</td>
                    <td className="text-center small">{m.clientMeetings || '–'}</td>
                    <td className="text-center small">{m.ministerMeetings || '–'}</td>
                    <td className="text-center small">{m.links || '–'}</td>
                    <td className="text-center small">{m.documents || '–'}</td>
                    <td className="text-center pe-3">
                      <span className={`badge rounded-pill ${m.total > 0 ? 'bg-primary' : 'bg-secondary'}`}>
                        {m.total}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
