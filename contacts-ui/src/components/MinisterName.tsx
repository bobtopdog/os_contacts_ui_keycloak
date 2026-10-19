'use client';

import { useQuery } from '@tanstack/react-query';


// ---------------------------------------------------------------------------
// ⚠️ ADJUST THIS FUNCTION to your minister API.
// I don't know the exact shape of your ministers endpoint, so this assumes:
//   GET {NEXT_PUBLIC_API_BASE_URL}/api/ministers/:id  →  { data: { name: '…' } }
// Change the URL and/or the property path to match your actual API.
// ---------------------------------------------------------------------------
const MINISTERS_API = process.env.NEXT_PUBLIC_PARLIAMENT_API_BASE_URL ?? 'http://localhost:3002';

async function fetchMinisterName(ministerId: number): Promise<string> {
  const res = await fetch(`${MINISTERS_API}/api/minister-meetings/${ministerId}`, { 
  cache: 'no-store', 
});
  if (!res.ok) throw new Error(`Failed to fetch minister: ${res.status}`);
  const json = await res.json();
  console.log(`${MINISTERS_API}/api/minister-meetings/${ministerId}`);
  return json.data?.name_display_as ?? `Minister #${ministerId}`;
}

/**
 * Resolves and displays a minister's name with 5-minute caching —
 * the same pattern as ContactName. Multiple usages of the same
 * ministerId share one request.
 */
export default function MinisterName({ ministerId }: { ministerId: number }) {
  const { data: name, isLoading } = useQuery<string>({
    queryKey: ['minister-name', ministerId],
    queryFn: () => fetchMinisterName(ministerId),
    enabled: ministerId > 0,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <span className="text-muted small">Loading…</span>;
  if (!name) return <span className="text-muted small">Unknown minister</span>;

  return <strong>{name}</strong>;
}
