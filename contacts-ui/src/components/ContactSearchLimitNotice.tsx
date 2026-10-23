'use client';

import type { PaginatedResponse, ContactSummary } from '@/types/contact';

/**
 * Shows "Showing 20 of 134 — refine your search…" when the live service
 * capped the results. Renders nothing otherwise.
 *
 *   <ContactSearchLimitNotice result={data} />
 */
export default function ContactSearchLimitNotice({
  result,
}: {
  result: PaginatedResponse<ContactSummary> | undefined;
}) {
  if (!result) return null;
  const shown = result.data.length;
  const total = result.pagination.total;
  if (total <= shown) return null;

  return (
    <div className="alert alert-info py-2 small d-flex align-items-center gap-2" role="status">
      <i className="bi bi-funnel" aria-hidden="true" />
      <span>
        Showing <strong>{shown}</strong> of <strong>{total.toLocaleString('en-GB')}</strong> matches.
        Refine your search or choose an organisation to narrow the results.
      </span>
    </div>
  );
}
