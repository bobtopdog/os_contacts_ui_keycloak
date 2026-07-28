'use client';

import { useTeamWeeklyStats } from '@/hooks/useTeamWeeklyStats';
import StatCard from './StatCard';

/**
 * 3. Total minister meetings recorded for the current week.
 */
export default function TeamStatMinisterMeetings({ teamId }: { teamId: string }) {
  const { data, isLoading, isError } = useTeamWeeklyStats(teamId);

  return (
    <StatCard
      icon="🏛️"
      label="Minister meetings this week"
      value={data?.ministerMeetingsCount ?? 0}
      sub={data ? `${data.weekStart} → ${data.weekEnd}` : undefined}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
