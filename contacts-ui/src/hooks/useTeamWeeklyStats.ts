'use client';

import { useQuery } from '@tanstack/react-query';
import type { TeamWeeklyStats } from '@/types/teamStats';

const NOTES_API = process.env.NEXT_PUBLIC_NOTES_API_URL ?? 'http://localhost:3000';

async function fetchTeamWeeklyStats(teamId: string): Promise<TeamWeeklyStats> {
  const res = await fetch(`${NOTES_API}/api/teams/${teamId}/stats`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch team stats: ${res.status}`);
  return (await res.json()).data;
}

/**
 * Shared hook for all team stat components.
 * Because every component uses the same queryKey, TanStack Query makes
 * ONE network request no matter how many stat components are on the page.
 */
export function useTeamWeeklyStats(teamId: string) {
  return useQuery<TeamWeeklyStats>({
    queryKey: ['team-weekly-stats', teamId],
    queryFn: () => fetchTeamWeeklyStats(teamId),
    staleTime: 60_000, // stats don't need second-by-second freshness
  });
}
