'use client';

import { useTeamWeeklyStats } from '@/hooks/useTeamWeeklyStats';

// Rename these when the client decides the real category headings
const SCORE_LABELS: Record<string, string> = {
  score1: 'Relevance',
  score2: 'Actionability',
  score3: 'Risk',
  score4: 'Meeting Score',
};

/**
 * 5. Sum of meeting scoring for the week — four separate totals.
 */
export default function TeamScoreSummary({ teamId }: { teamId: string }) {
  const { data, isLoading, isError } = useTeamWeeklyStats(teamId);

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-white border-bottom py-2">
        <h6 className="fw-semibold mb-0">⭐ Client Meeting scores this week</h6>
      </div>
      <div className="card-body py-3">

        {isLoading && (
          <div className="text-center text-muted py-3">
            <span className="spinner-border spinner-border-sm" />
          </div>
        )}

        {isError && !isLoading && (
          <p className="text-muted small mb-0">Could not load score summary.</p>
        )}

        {data && (
          <div className="row g-2">
            {(Object.keys(SCORE_LABELS) as Array<keyof typeof data.scoreTotals>).map(
              (key) => (
                <div key={key} className="col-6 col-md-3">
                  <div className="bg-light rounded text-center py-2">
                    <div className="fs-4 fw-bold text-warning">
                      {data.scoreTotals[key]}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {SCORE_LABELS[key]}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {data && data.clientMeetingsCount === 0 && (
          <p className="text-muted small text-center mb-0 mt-2">
            No scored meetings this week.
          </p>
        )}
      </div>
    </div>
  );
}
