'use client';

import { useTeamWeeklyStats } from '@/hooks/useTeamWeeklyStats';
import StatCard from './StatCard';

/**
 * 1. Total client meetings recorded for the current week.
 */
export default function TeamStatClientMeetings({ teamId }: { teamId: string }) {
  const { data, isLoading, isError } = useTeamWeeklyStats(teamId);

  return (
    <StatCard
      icon="🤝"
      label="Client meetings this week"
      value={data?.clientMeetingsCount ?? 0}
      sub={data ? `${data.weekStart} → ${data.weekEnd}` : undefined}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
