'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import type { Organisation } from '@/types/contact';

interface Props {
  organisations: Organisation[];
}

export default function SearchBar({ organisations }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [organisation, setOrganisation] = useState(searchParams.get('organisation') ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fire search automatically 300ms after the user stops typing or changes the dropdown
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (organisation) params.set('organisation', organisation);
      // Reset to page 1 on new search
      router.push(`/?${params.toString()}`);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, organisation]);

  function handleClear() {
    setQuery('');
    setOrganisation('');
    router.push('/');
  }

  return (
    <div className="mb-4">
<div className="card mb-4">
<div className="card-body">
<div className="d-flex justify-content-between align-items-center mb-3">
<h5 className="card-title mb-0">Search contacts</h5>

</div>
<div className="row g-2">
        {/* Name / keyword search */}
        <div className="col-12 col-md-7">
          <div className="input-group shadow-sm">
            <span className="input-group-text bg-white border-end-0">🔍</span>
            <input
              type="search"
              className="form-control border-start-0 ps-0"
              placeholder="Search by name, role or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search contacts"
            />
          </div>
        </div>

        {/* Organisation dropdown */}
        <div className="col-12 col-md-4">
          <select
            className="form-select shadow-sm"
            value={organisation}
            onChange={(e) => setOrganisation(e.target.value)}
            aria-label="Filter by organisation"
          >
            <option value="">All organisations</option>
            {organisations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear button — only shown when there's an active filter */}
        {(query || organisation) && (
          <div className="col-12 col-md-1 d-flex align-items-center">
            <button
              className="btn btn-outline-secondary btn-lg w-100"
              onClick={handleClear}
              title="Clear search"
            >
              ✕ 
            </button>
          </div>
        )}
      </div>

</div>
</div>

      

      {/* Active filter badges */}
      {(query || organisation) && (
        <div className="d-flex gap-2 flex-wrap mt-2">
          {query && (
            <span className="badge bg-primary rounded-pill">
              🔍 {query}
            </span>
          )}
          {organisation && (
            <span className="badge bg-secondary rounded-pill">
              🏢 {organisation}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
