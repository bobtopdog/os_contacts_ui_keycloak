import type { Community, CommunityMember, CommunityTag } from '@/types/community';

const NOTES_API = process.env.NEXT_PUBLIC_NOTES_API_URL ?? 'http://localhost:3000';

// ---- Communities ----------------------------------------------------------

export async function getUserCommunities(username: string): Promise<Community[]> {
  const res = await fetch(
    `${NOTES_API}/api/communities?username=${encodeURIComponent(username)}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error(`Failed to fetch communities: ${res.status}`);
  return (await res.json()).data;
}

export async function createCommunity(payload: {
  name: string;
  description: string;
  username: string;
}): Promise<Community> {
  const res = await fetch(`${NOTES_API}/api/communities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to create community: ${res.status}`);
  }
  return (await res.json()).data;
}

export async function deleteCommunity(communityId: string, username: string): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/communities/${communityId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to delete community: ${res.status}`);
  }
}

// ---- Members --------------------------------------------------------------

export async function getCommunityMembers(communityId: string): Promise<CommunityMember[]> {
  const res = await fetch(`${NOTES_API}/api/communities/${communityId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch members: ${res.status}`);
  return (await res.json()).data;
}

export async function addCommunityMember(
  communityId: string,
  requestingUser: string,
  newMemberUsername: string
): Promise<CommunityMember> {
  const res = await fetch(`${NOTES_API}/api/communities/${communityId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestingUser, newMemberUsername }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to add member: ${res.status}`);
  }
  return (await res.json()).data;
}

export async function removeCommunityMember(
  communityId: string,
  memberId: string,
  username: string
): Promise<void> {
  const res = await fetch(
    `${NOTES_API}/api/communities/${communityId}/members/${memberId}`,
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

// ---- Contact tags ---------------------------------------------------------

export async function getContactTags(contactId: string): Promise<CommunityTag[]> {
  const res = await fetch(`${NOTES_API}/api/communities/contacts/${contactId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch tags: ${res.status}`);
  return (await res.json()).data;
}

export async function postContactTag(payload: {
  contactId: string;
  communityId: string;
  taggedBy: string;
}): Promise<CommunityTag> {
  const res = await fetch(`${NOTES_API}/api/communities/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to tag contact: ${res.status}`);
  }
  return (await res.json()).data;
}

export async function deleteContactTag(tagId: string, username: string): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/communities/tags/${tagId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to remove tag: ${res.status}`);
  }
}
