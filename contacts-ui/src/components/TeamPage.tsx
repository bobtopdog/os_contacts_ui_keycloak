'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTeamPage, patchTeam } from '@/libs/api';
import type { TeamDetail, TeamMember } from '@/types/contact';
import Link from 'next/link';
import TeamStatClientMeetings from '@/components/teamStats/TeamStatClientMeetings';
import TeamStatMinisterMeetings from '@/components/teamStats/TeamStatMinisterMeetings';
import TeamNotesOverview from '@/components/teamStats/TeamNotesOverview';
import TeamScoreSummary from '@/components/teamStats/TeamScoreSummary';
import TeamMemberActivity from '@/components/teamStats/TeamMemberActivity';
import TeamRecentClientMeetings from './teamStats/TeamRecentClientMeetings';
import TeamRecentMinisterMeetings from './teamStats/TeamRecentMinisterMeetings';
import UserSummaryLink from '@/components/UserSummaryLink';
interface Props {
  teamId: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Team details section — editable by primary contacts
// ---------------------------------------------------------------------------
function TeamDetails({
  team, isPrimaryContact, username, onSaved,
}: {
  team: TeamDetail;
  isPrimaryContact: boolean;
  username: string;
  onSaved: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(team.description);
  const [intranetUrl, setIntranetUrl] = useState(team.intranetUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setIsSaving(true);
    setError('');
    try {
      await patchTeam(team.teamId, username, description, intranetUrl);
      setIsEditing(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setDescription(team.description);
    setIntranetUrl(team.intranetUrl);
    setIsEditing(false);
    setError('');
  }

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-secondary text-white py-3 d-flex justify-content-between align-items-center">
        <h2 className="h4 fw-bold mb-0">👥 {team.teamName}</h2>
        {isPrimaryContact && !isEditing && (
          <button
            className="btn btn-outline-light btn-sm"
            onClick={() => setIsEditing(true)}
          >
            ✏️ Edit
          </button>
        )}
      </div>

      <div className="card-body px-4 py-3">
        {!isEditing ? (
          <>
            {/* Description */}
            <div className="mb-3">
              <div className="text-muted small fw-medium mb-1">About this team</div>
              {team.description ? (
                <p style={{ whiteSpace: 'pre-wrap' }}>{team.description}</p>
              ) : (
                <p className="text-muted fst-italic small">No description yet.</p>
              )}
            </div>

            {/* Intranet link */}
            {team.intranetUrl && (
              <div className="mb-3">
                <div className="text-muted small fw-medium mb-1">Team intranet page</div>
                <a
                  href={team.intranetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary btn-sm"
                >
                  🌐 Visit team page ↗
                </a>
              </div>
            )}

            {isPrimaryContact && !team.intranetUrl && (
              <p className="text-muted fst-italic small">No intranet link set yet.</p>
            )}

            {team.updatedAt && (
              <small className="text-muted">
                Last updated: {formatDate(team.updatedAt)}
              </small>
            )}
          </>
        ) : (
          <>
            <div className="mb-3">
              <label className="form-label fw-medium">Team description</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Describe what this team does…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-medium">Intranet page URL</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://intranet.example.com/teams/…"
                value={intranetUrl}
                onChange={(e) => setIntranetUrl(e.target.value)}
                disabled={isSaving}
              />
            </div>
            {error && (
              <div className="alert alert-danger py-2 small mb-2">{error}</div>
            )}
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm px-4"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving
                  ? <><span className="spinner-border spinner-border-sm me-1" />Saving…</>
                  : 'Save changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Members table
// ---------------------------------------------------------------------------
function MembersTable({ members }: { members: TeamMember[] }) {
  const primaryContacts = members.filter((m) => m.isPrimary);
  const otherMembers = members.filter((m) => !m.isPrimary);
  const sorted = [...primaryContacts, ...otherMembers];

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-bottom py-3">
        <h5 className="fw-semibold mb-0">
          Team Members
          <span className="badge bg-secondary ms-2 rounded-pill">{members.length}</span>
        </h5>
      </div>
      <div className="card-body p-0">
        {members.length === 0 ? (
          <p className="text-muted small p-3">No members in this team yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-3">Username</th>
                  <th>Role</th>
                  <th>Member since</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((member) => (
                  <tr key={member.userTeamId}>
                    <td className="ps-3 fw-medium">
                      👤 
                      <UserSummaryLink username={member.username} />
                    </td>
                    <td>
                      {member.isPrimary ? (
                        <span className="badge bg-success rounded-pill">
                          ⭐ Primary contact
                        </span>
                      ) : (
                        <span className="text-muted small">Member</span>
                      )}
                    </td>
                    <td className="text-muted small">
                      {formatDate(member.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main TeamPage component
// ---------------------------------------------------------------------------
export default function TeamPage({ teamId }: Props) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const username = session?.user?.username ?? '';

  const { data, isLoading, isError } = useQuery<{
    team: TeamDetail;
    members: TeamMember[];
  }>({
    queryKey: ['team', teamId],
    queryFn: () => getTeamPage(teamId),
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['team', teamId] });
  }

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <span className="spinner-border" role="status" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="alert alert-warning">
        Could not load team details. Please try refreshing.
      </div>
    );
  }

  const isPrimaryContact = data.members.some(
    (m) => m.username === username && m.isPrimary
  );

  return (
    <>
    <div className="row">
      <div className="col-6 col-md-8 col-lg-6">
        
      </div>
    </div>
    <div className="row justify-content-center">
      <div className="col-6 col-md-8 col-lg-6">
      
      <TeamDetails
        team={data.team}
        isPrimaryContact={isPrimaryContact}
        username={username}
        onSaved={refresh}
      /></div>
<div className="col-4 col-md-8 col-lg-6">
      <MembersTable members={data.members} /></div>
      </div>
 {/* Weekly stats row */}
    <div className="row g-3 mb-4">
      <div className="col-6 col-md-3">
        <TeamStatClientMeetings teamId={teamId} />
      </div>
      <div className="col-6 col-md-3">
        <TeamStatMinisterMeetings teamId={teamId} />
      </div>
      <div className="col-12 col-md-6">
        <TeamScoreSummary teamId={teamId} />
      </div>
    </div>

    <div className="row g-3 mb-4">
      <div className="col-12 col-md-7">
        <TeamMemberActivity teamId={teamId} />
      </div>
      <div className="col-12 col-md-5">
        <TeamNotesOverview teamId={teamId} />
      </div>
    </div>

    <div className="row g-3 mb-4">
      <div className="col-12 col-md-7">
        <TeamRecentClientMeetings teamId={teamId} />
      </div>
      <div className="col-12 col-md-5">
        <TeamRecentMinisterMeetings teamId={teamId} />
      </div>
    </div>


    </>
  );
}
