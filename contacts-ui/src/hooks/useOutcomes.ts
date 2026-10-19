'use client';

import { useQuery } from '@tanstack/react-query';
import type { Outcome } from '@/types/outcome';

const NOTES_API = process.env.NEXT_PUBLIC_NOTES_API_URL ?? '';

async function fetchOutcomes(): Promise<Outcome[]> {
  const res = await fetch(`${NOTES_API}/api/lookups/outcomes`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load outcomes: ${res.status}`);
  return (await res.json()).data;
}

/**
 * Shared outcome lookup. One request per page however many selectors and
 * badges are rendered; cached for 30 minutes (the values rarely change).
 */
export function useOutcomes() {
  return useQuery<Outcome[]>({
    queryKey: ['lookup-outcomes'],
    queryFn: fetchOutcomes,
    staleTime: 30 * 60 * 1000,
  });
}
