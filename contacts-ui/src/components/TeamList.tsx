'use client';


import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import type { Team } from '@/types/contact';
import { getProfileTeams } from '@/libs/api';

// ---------------------------------------------------------------------------
// Teams management section
// ---------------------------------------------------------------------------
function TeamsSection({ username }: { username: string }) {
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [addError, setAddError] = useState('');

  const { data, isLoading, isError } = useQuery<{
    allTeams: Team[];

  }>({
    queryKey: ['profile-teams', username],
    queryFn: () => getProfileTeams(username),
    enabled: !!username,
  });


  const availableTeams = data?.allTeams;

  return (
    <div className="card border-0 shadow-sm">
      
      <div className="card-body">
        {/* Add team form */}
        <div className="bg-light rounded p-3 mb-4">
         
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-12">
              <label className="form-label small mb-1">Join a team</label>
              <select
                className="form-select"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={ availableTeams?.length === 0}
              >
                <option value="">
                  {availableTeams?.length === 0
                    ? 'You are in all available teams'
                    : 'Select a team…'}
                </option>
                {availableTeams?.map((team) => (
                  <option key={team.teamId} value={team.teamId}>
                    {team.teamName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {addError && (
            <div className="alert alert-danger py-1 small mt-2">{addError}</div>
          )}
        </div>


        
      </div>
    </div>
  );
}

export default function TeamList() {


}
