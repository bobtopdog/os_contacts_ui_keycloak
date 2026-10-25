'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfileTeams, postUserTeam, deleteUserTeam } from '@/libs/api';
import type { Team, UserTeam } from '@/types/contact';
import MyNotes from '@/components/MyNotes';
import MyMeetings from '@/components/MyMeetings';
import CommunitiesPanel from '@/components/CommunitiesPanel';
import MeetingGroupsPanel from '@/components/MeetingGroupsPanel';
import Link from 'next/link';
import AboutMeCard from '@/components/AboutMeCard';
import { isAdminUser } from '@/libs/adminCheck';



// ---------------------------------------------------------------------------
// Profile info card — populated from session token
// ---------------------------------------------------------------------------
function ProfileCard({ name, username, email, image }: {
  
  name?: string | null;
  username: string;
  email?: string | null;
  image?: string | null;
}) {
  const { data: session, status } = useSession();
//const roles = session?.user?.roles ?? [];
  const isAdmin = isAdminUser(session?.user);


  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-primary text-white py-4">
        <div className="d-flex align-items-center gap-3">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={username}
              width={64}
              height={64}
              className="rounded-circle border border-white border-2"
            />
          ) : (
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
              style={{
                width: 64, height: 64, fontSize: '1.4rem',
                background: 'rgba(255,255,255,0.25)',
              }}
            >
              {username[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="h4 fw-bold mb-0">{name || username}</h2>
            <div className="opacity-75 small mt-1">@{username}</div>
          </div>
        </div>
      </div>
      <div className="card-body px-4 py-3">
        <div className="d-flex align-items-start gap-3 py-2 border-bottom">
          <span style={{ width: '1.5rem', textAlign: 'center' }}>👤</span>
          <div>
            <div className="text-muted small">Username</div>
            <div className="fw-medium">{username}</div>
          </div>
        </div>
        {name && (
          <div className="d-flex align-items-start gap-3 py-2 border-bottom">
            <span style={{ width: '1.5rem', textAlign: 'center' }}>🪪</span>
            <div>
              <div className="text-muted small">Display name</div>
              <div className="fw-medium">{name}</div>
            </div>
          </div>
        )}
        {email && (
          <div className="d-flex align-items-start gap-3 py-2 border-bottom">
            <span style={{ width: '1.5rem', textAlign: 'center' }}>✉️</span>
            <div>
              <div className="text-muted small">Email</div>
              <div className="fw-medium">{email}</div>
            </div>
          </div>
        )}
        if (isAdmin) {
            <div className="d-flex align-items-start gap-3 py-2 border-bottom">
            <span style={{ width: '1.5rem', textAlign: 'center' }}>⚙️</span>
            <div>
              <div className="small"> <Link href="/admin" className="nav-link">Admin</Link></div>
              <div className="fw-medium">Administration page</div>
            </div>
          </div>
       }
       <AboutMeCard username={username} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UserTeamRow — single team membership with delete
// ---------------------------------------------------------------------------
function UserTeamRow({
  userTeam, username, onDelete,
}: {
  userTeam: UserTeam;
  username: string;
  onDelete: (userTeamId: string) => Promise<void>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleDelete() {
    setIsDeleting(true);
    setError('');
    try {
      await onDelete(userTeam.userTeamId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove team');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }
  function handleClick(e: React.MouseEvent) {
    e.preventDefault();

    // Close the offcanvas first
    const offcanvasEl = document.getElementById('offcanvasExample');
    if (offcanvasEl && typeof window !== 'undefined') {
      // @ts-expect-error - bootstrap is loaded globally
      const offcanvas = window.bootstrap?.Offcanvas?.getInstance(offcanvasEl);
      offcanvas?.hide();
    }

    // Then navigate data-bs-dismiss="offcanvas"
    router.push(`/teams/${userTeam.teamId}`);
  }
  return (
    <div className="card border-0 bg-light mb-2">
      <div className="card-body py-2 px-3">
        {!confirmDelete ? (
          <>
            <div className="d-flex align-items-center justify-content-between gap-2">
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '1.2rem' }}>👥</span>
                <div>

                  <a
                    href={`/teams/${userTeam.teamId}`}
                    onClick={handleClick}
                    className="text-decoration-none " data-bs-dismiss="offcanvas"
                  >
                    <span className="fw-medium">{userTeam.teamName}</span>
                  </a>
                  {userTeam.isPrimary && (
                    <span className="badge bg-success ms-2 rounded-pill">
                      ⭐ Primary contact
                    </span>
                  )}
                </div>
              </div>
              <button
                className="btn btn-outline-danger btn-sm py-0"
                onClick={() => setConfirmDelete(true)}
                title="Leave team"
              >
                🗑️ Leave
              </button>
            </div>
            {error && <div className="alert alert-danger py-1 small mt-1">{error}</div>}
          </>
        ) : (
          <>
            <p className="mb-2 text-danger fw-medium small">
              Remove yourself from <strong>{userTeam.teamName}</strong>?
            </p>
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting
                  ? <><span className="spinner-border spinner-border-sm me-1" />Removing…</>
                  : 'Yes, leave'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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
    userTeams: UserTeam[];
  }>({
    queryKey: ['profile-teams', username],
    queryFn: () => getProfileTeams(username),
    enabled: !!username,
  });

  const addMutation = useMutation({
    mutationFn: postUserTeam,
    onSuccess: () => {
      setSelectedTeamId('');
      setIsPrimary(false);
      setAddError('');
      queryClient.invalidateQueries({ queryKey: ['profile-teams', username] });
    },
    onError: (err: Error) => setAddError(err.message),
  });

  async function handleDelete(userTeamId: string) {
    await deleteUserTeam(userTeamId, username);
    queryClient.invalidateQueries({ queryKey: ['profile-teams', username] });
  }

  function handleAdd() {
    if (!selectedTeamId) return;
    setAddError('');
    addMutation.mutate({ username, teamId: selectedTeamId, isPrimary });
  }

  const availableTeams = data?.allTeams.filter(
    (t) => !data.userTeams.some((ut) => ut.teamId === t.teamId)
  ) ?? [];

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-bottom py-3">
        <h5 className="fw-semibold mb-0">👥 My Teams</h5>
      </div>
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
                disabled={addMutation.isPending || availableTeams.length === 0}
              >
                <option value="">
                  {availableTeams.length === 0
                    ? 'You are in all available teams'
                    : 'Select a team…'}
                </option>
                {availableTeams.map((team) => (
                  <option key={team.teamId} value={team.teamId}>
                    {team.teamName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-9">
              <div className="form-check ms-1 mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="isPrimaryCheck"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  disabled={addMutation.isPending}
                />
                <label className="form-check-label small" htmlFor="isPrimaryCheck">
                  Primary contact for this team
                </label>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <button
                className="btn btn-sm btn-primary"
                onClick={handleAdd}
                disabled={!selectedTeamId || addMutation.isPending}
              >
                {addMutation.isPending
                  ? <span className="spinner-border spinner-border-sm" />
                  : 'Add'}
              </button>
            </div>
          </div>
          {addError && (
            <div className="alert alert-danger py-1 small mt-2">{addError}</div>
          )}
        </div>

        {/* Current memberships */}
        {isLoading && (
          <div className="text-center text-muted py-3">
            <span className="spinner-border spinner-border-sm me-2" />Loading teams…
          </div>
        )}
        {isError && (
          <div className="alert alert-warning py-2 small">
            Could not load teams. Please try refreshing.
          </div>
        )}
        {data?.userTeams.length === 0 && (
          <p className="text-muted small">You are not a member of any teams yet.</p>
        )}
        {data?.userTeams.map((userTeam) => (
          <UserTeamRow
            key={userTeam.userTeamId}
            userTeam={userTeam}
            username={username}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}





// ---------------------------------------------------------------------------
// ProfilePanel — self-contained, works on a page or inside an offcanvas
// ---------------------------------------------------------------------------
export default function ProfilePanel() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="text-center py-5">
        <span className="spinner-border" role="status" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="alert alert-warning">Please sign in to view your profile.</div>
    );
  }

  const { username, name, email, image } = session.user;

  return (
    <>
      <ul className="nav nav-tabs" id="myTab" role="tablist">
        <li className="nav-item" role="presentation">
          <button className="nav-link active" id="home-tab" data-bs-toggle="tab" data-bs-target="#home" type="button" role="tab" aria-controls="home" aria-selected="true">About Me</button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link" id="profile-tab" data-bs-toggle="tab" data-bs-target="#profile" type="button" role="tab" aria-controls="profile" aria-selected="false">Teams</button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link" id="contact-tab" data-bs-toggle="tab" data-bs-target="#contact" type="button" role="tab" aria-controls="contact" aria-selected="false">My Private Notes</button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link" id="meeting-tab" data-bs-toggle="tab" data-bs-target="#meeting" type="button" role="tab" aria-controls="meeting" aria-selected="false">My Meetings</button>
        </li>
      </ul>
      <div className="tab-content" id="myTabContent">
        <div className="tab-pane fade show active" id="home" role="tabpanel" aria-labelledby="home-tab">
          <ProfileCard username={username} name={name} email={email} image={image} />
        </div>
        <div className="tab-pane fade" id="profile" role="tabpanel" aria-labelledby="profile-tab">
          <TeamsSection username={username} />
        </div>
        <div className="tab-pane fade" id="contact" role="tabpanel" aria-labelledby="contact-tab">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="fw-semibold mb-0">👥 My Private Notes</h5>
            </div>
            <div className="card-body">
              <MyNotes userName={username} />
            </div>

          </div>
        </div>
        <div className="tab-pane fade" id="meeting" role="tabpanel" aria-labelledby="meeting-tab">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="fw-semibold mb-0">👥 My Meetings</h5>
            </div>
            <div className="card-body">
              <MyMeetings userName={username} />
            </div>

          </div>
        </div>
        
       
      </div>


    </>
  );
}
