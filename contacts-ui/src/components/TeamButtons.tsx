'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getProfileTeams } from '@/libs/api';
import type { Team } from '@/types/contact';

// Reuse the allTeams from getProfileTeams but with a dummy username
// since we only need the full list
async function getAllTeams(): Promise<Team[]> {
  const res = await fetch('/api/teams', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch teams');
  const json = await res.json();
  return json.data;
}

export default function TeamButtons() {
  const router = useRouter();

  const { data: teams, isLoading } = useQuery<Team[]>({
    queryKey: ['all-teams'],
    queryFn: getAllTeams,
  });

  if (isLoading) {
    return (
      <div className="mb-4 d-flex gap-2 flex-wrap">
        {[1, 2, 3].map((i) => (
          <div key={i} className="placeholder-glow">
            <span className="placeholder rounded-pill" style={{ width: '80px', height: '32px', display: 'block' }} />
          </div>
        ))}
      </div>
    );
  }

  if (!teams?.length) return null;

  return (
    <div className="mb-4">
      <p className="text-muted small fw-medium mb-2">Browse by team:</p>
      <div className="d-flex gap-2 flex-wrap">
        {teams.map((team) => (
          <button
            key={team.teamId}
            className="btn btn-outline-primary btn-sm rounded-pill"
            onClick={() => router.push(`/teams/${team.teamId}`)}
          >
            👥 {team.teamName}
          </button>
        ))}
      </div>
      <p className="text-muted small fw-medium mb-2"><br /><a href="mailto:admin@example.com?subject=Request%20New%20Team" className="text-decoration-underline">Request new team</a></p>
    </div>
  );
}
