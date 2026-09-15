'use client';

import { useQuery } from '@tanstack/react-query';
import type { AdminLookupItem, LookupKind } from '@/types/adminLookup';

const NOTES_API = process.env.NEXT_PUBLIC_NOTES_API_URL ?? 'http://localhost:3000';

async function fetchActive(kind: LookupKind): Promise<AdminLookupItem[]> {
  const res = await fetch(`${NOTES_API}/api/lookup/${kind}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${kind}: ${res.status}`);
  return (await res.json()).data;
}

interface Props {
  kind: 'tags' | 'areas';
  title: string;
}

/**
 * Read-only reference listing for the user help page.
 * Shows ACTIVE rows only, with name + description. No editing controls.
 *
 * Usage on your help page:
 *   <LookupReference kind="tags"  title="🏷️ Tags" />
 *   <LookupReference kind="areas" title="🗺️ Areas" />
 */
export default function LookupReference({ kind, title }: Props) {
  const { data: items, isLoading, isError } = useQuery<AdminLookupItem[]>({
    queryKey: ['lookup', kind],
    queryFn: () => fetchActive(kind),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-bottom py-2">
        <h6 className="fw-semibold mb-0">{title}</h6>
      </div>
      <div className="card-body py-2">
        {isLoading && (
          <div className="text-center text-muted py-3">
            <span className="spinner-border spinner-border-sm" />
          </div>
        )}
        {isError && (
          <p className="text-muted small mb-0">Could not load the list.</p>
        )}
        {items && items.length === 0 && (
          <p className="text-muted small mb-0">Nothing defined yet.</p>
        )}
        {items && items.length > 0 && (
          <dl className="row mb-0">
            {items.map((item) => (
              <div key={item.id} className="py-1 border-bottom row mx-0">
                <dt className="col-sm-3 small">{item.name}</dt>
                <dd className="col-sm-9 small text-muted mb-0">
                  {item.description || '—'}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
