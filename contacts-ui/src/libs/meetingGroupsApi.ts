import type { MeetingGroup, MeetingGroupMember, MeetingGroupTag, GroupRole } from '@/types/meetingGroup';

const NOTES_API = process.env.NEXT_PUBLIC_NOTES_API_URL ?? 'http://localhost:3000';

// ---- Groups ----------------------------------------------------------------

export async function getUserMeetingGroups(username: string): Promise<MeetingGroup[]> {
  const res = await fetch(
    `${NOTES_API}/api/meeting-groups?username=${encodeURIComponent(username)}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error(`Failed to fetch groups: ${res.status}`);
  return (await res.json()).data;
}

export async function createMeetingGroup(name: string, username: string): Promise<MeetingGroup> {
  const res = await fetch(`${NOTES_API}/api/meeting-groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to create group: ${res.status}`);
  }
  return (await res.json()).data;
}

export async function renameMeetingGroup(
  groupId: string, username: string, name: string
): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/meeting-groups/${groupId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to rename group: ${res.status}`);
  }
}

export async function deleteMeetingGroup(groupId: string, username: string): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/meeting-groups/${groupId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to delete group: ${res.status}`);
  }
}

// ---- Members ---------------------------------------------------------------

export async function getMeetingGroupMembers(groupId: string): Promise<MeetingGroupMember[]> {
  const res = await fetch(`${NOTES_API}/api/meeting-groups/${groupId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch members: ${res.status}`);
  return (await res.json()).data;
}

export async function addMeetingGroupMember(
  groupId: string, requestingUser: string, newUsername: string, role: GroupRole
): Promise<MeetingGroupMember> {
  const res = await fetch(`${NOTES_API}/api/meeting-groups/${groupId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestingUser, newUsername, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to add member: ${res.status}`);
  }
  return (await res.json()).data;
}

export async function removeMeetingGroupMember(
  groupId: string, groupMemberId: string, username: string
): Promise<void> {
  const res = await fetch(
    `${NOTES_API}/api/meeting-groups/${groupId}/members/${groupMemberId}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to remove member: ${res.status}`);
  }
}

export async function setMeetingGroupMemberRole(
  groupId: string, groupMemberId: string, username: string, role: GroupRole
): Promise<void> {
  const res = await fetch(
    `${NOTES_API}/api/meeting-groups/${groupId}/members/${groupMemberId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, role }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to change role: ${res.status}`);
  }
}

// ---- CSV download (requirement 6) -------------------------------------------

export function getGroupCsvUrl(groupId: string, username: string): string {
  return `${NOTES_API}/api/meeting-groups/${groupId}/csv?username=${encodeURIComponent(username)}`;
}

// ---- Meeting tags ------------------------------------------------------------

export async function getMeetingGroupTags(meetingId: string): Promise<MeetingGroupTag[]> {
  const res = await fetch(`${NOTES_API}/api/meeting-groups/tags/${meetingId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch tags: ${res.status}`);
  return (await res.json()).data;
}

export async function tagMeetingWithGroup(payload: {
  meetingId: string; groupId: string; taggedBy: string;
}): Promise<MeetingGroupTag> {
  const res = await fetch(`${NOTES_API}/api/meeting-groups/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to tag meeting: ${res.status}`);
  }
  return (await res.json()).data;
}

export async function removeMeetingGroupTag(
  meetingId: string, tagId: string, username: string
): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/meeting-groups/tags/${meetingId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tagId, username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to remove tag: ${res.status}`);
  }
}

export async function duplicateMeetingGroup(
      groupId: string, username: string
    ): Promise<MeetingGroup> {
      const res = await fetch(`${NOTES_API}/api/meeting-groups/${groupId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? `Failed to duplicate group: ${res.status}`);
      }
      return (await res.json()).data;
    }
