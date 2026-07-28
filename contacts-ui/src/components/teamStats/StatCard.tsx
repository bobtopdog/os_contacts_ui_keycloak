'use client';

/**
 * Shared presentational shell for simple number stats.
 * Handles the loading / error states consistently.
 */
export default function StatCard({
  icon, label, value, sub, isLoading, isError,
}: {
  icon: string;
  label: string;
  value: number | string;
  sub?: string;
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body text-center py-3">
        <div style={{ fontSize: '1.6rem' }}>{icon}</div>

        {isLoading && (
          <div className="py-2">
            <span className="spinner-border spinner-border-sm text-muted" />
          </div>
        )}

        {isError && !isLoading && (
          <div className="text-muted small py-2">—</div>
        )}

        {!isLoading && !isError && (
          <div className="fs-3 fw-bold">{value}</div>
        )}

        <div className="text-muted small fw-medium">{label}</div>
        {sub && <div className="text-muted" style={{ fontSize: '0.7rem' }}>{sub}</div>}
      </div>
    </div>
  );
}
