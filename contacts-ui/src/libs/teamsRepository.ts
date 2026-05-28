import { notesQuery } from './notesDb';
import type { Team, UserTeam } from '@/types/contact';

interface TeamRow {
  team_id: string;
  team_name: string;
}

interface UserTeamRow {
  user_team_id: string;
  username: string;
  team_id: string;
  team_name: string;
  is_primary: boolean;
  created_at: Date;
}

function toTeam(row: TeamRow): Team {
  return { teamId: row.team_id, teamName: row.team_name };
}

function toUserTeam(row: UserTeamRow): UserTeam {
  return {
    userTeamId: row.user_team_id,
    username: row.username,
    teamId: row.team_id,
    teamName: row.team_name,
    isPrimary: row.is_primary,
    createdAt: row.created_at.toISOString(),
  };
}

// All available teams for the dropdown
export async function getAllTeams(): Promise<Team[]> {
  const rows = await notesQuery<TeamRow>(
    `SELECT team_id, team_name FROM teams ORDER BY team_name ASC`
  );
  return rows.map(toTeam);
}

// All teams a user belongs to
export async function getUserTeams(username: string): Promise<UserTeam[]> {
  const rows = await notesQuery<UserTeamRow>(
    `SELECT ut.user_team_id, ut.username, ut.team_id, t.team_name,
            ut.is_primary, ut.created_at
     FROM user_teams ut
     JOIN teams t ON t.team_id = ut.team_id
     WHERE ut.username = $1
     ORDER BY t.team_name ASC`,
    [username]
  );
  return rows.map(toUserTeam);
}

// Add a user to a team
export async function addUserTeam(
  username: string,
  teamId: string,
  isPrimary: boolean
): Promise<UserTeam> {
  const rows = await notesQuery<UserTeamRow>(
    `INSERT INTO user_teams (username, team_id, is_primary)
     VALUES ($1, $2, $3)
     ON CONFLICT (username, team_id)
       DO UPDATE SET is_primary = EXCLUDED.is_primary
     RETURNING user_team_id, username, team_id, is_primary, created_at`,
    [username, teamId, isPrimary]
  );

  // Join back to get team_name
  const teamRows = await notesQuery<TeamRow>(
    `SELECT team_id, team_name FROM teams WHERE team_id = $1`,
    [teamId]
  );

  return toUserTeam({ ...rows[0], team_name: teamRows[0].team_name });
}

// Remove a user from a team
export async function removeUserTeam(
  userTeamId: string,
  username: string
): Promise<boolean> {
  const rows = await notesQuery<{ user_team_id: string }>(
    `DELETE FROM user_teams
     WHERE user_team_id = $1 AND username = $2
     RETURNING user_team_id`,
    [userTeamId, username]
  );
  return rows.length > 0;
}

interface TeamDetailRow {
  team_id: string;
  team_name: string;
  description: string;
  intranet_url: string;
  updated_at: Date;
}

interface TeamMemberRow {
  user_team_id: string;
  username: string;
  is_primary: boolean;
  created_at: Date;
}

import type { TeamDetail, TeamMember } from '@/types/contact';

export async function getTeamById(teamId: string): Promise<TeamDetail | null> {
  const rows = await notesQuery<TeamDetailRow>(
    `SELECT team_id, team_name, description, intranet_url, updated_at
     FROM teams WHERE team_id = $1`,
    [teamId]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    teamId: r.team_id,
    teamName: r.team_name,
    description: r.description,
    intranetUrl: r.intranet_url,
    updatedAt: r.updated_at.toISOString(),
  };
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const rows = await notesQuery<TeamMemberRow>(
    `SELECT user_team_id, username, is_primary, created_at
     FROM user_teams
     WHERE team_id = $1
     ORDER BY is_primary DESC, username ASC`,
    [teamId]
  );
  return rows.map((r) => ({
    userTeamId: r.user_team_id,
    username: r.username,
    isPrimary: r.is_primary,
    createdAt: r.created_at.toISOString(),
  }));
}

export async function updateTeamDetails(
  teamId: string,
  description: string,
  intranetUrl: string
): Promise<TeamDetail | null> {
  const rows = await notesQuery<TeamDetailRow>(
    `UPDATE teams
     SET description = $1, intranet_url = $2
     WHERE team_id = $3
     RETURNING team_id, team_name, description, intranet_url, updated_at`,
    [description, intranetUrl, teamId]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    teamId: r.team_id,
    teamName: r.team_name,
    description: r.description,
    intranetUrl: r.intranet_url,
    updatedAt: r.updated_at.toISOString(),
  };
}
