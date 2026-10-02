import type {
  CommunityCardData, CommunityDetail, CommunityPoc,
  CommunityNote, CommunityHeadline, CommunityMeeting,
} from '@/types/communityPages';

const NOTES_API = process.env.NEXT_PUBLIC_NOTES_API_URL ?? 'http://localhost:3000';
const json = { 'Content-Type': 'application/json' };

async function ok<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `${fallback}: ${res.status}`);
  }
  return (await res.json()).data;
}

// ---- Listing + detail ----
export async function getAllCommunities(username: string): Promise<CommunityCardData[]> {
  const res = await fetch(`${NOTES_API}/api/communities/all?username=${encodeURIComponent(username)}`, { cache: 'no-store' });
  return ok(res, 'Failed to load communities');
}

export async function getCommunityDetail(communityId: string, username: string): Promise<CommunityDetail> {
  const res = await fetch(`${NOTES_API}/api/communities/${communityId}/detail?username=${encodeURIComponent(username)}`, { cache: 'no-store' });
  return ok(res, 'Failed to load community');
}

// ---- PoC ----
export async function getCommunityPocs(communityId: string): Promise<CommunityPoc[]> {
  const res = await fetch(`${NOTES_API}/api/communities/${communityId}/poc`, { cache: 'no-store' });
  return ok(res, 'Failed to load PoCs');
}
export async function setCommunityPoc(communityId: string, username: string, isPoc: boolean): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/communities/${communityId}/poc`, {
    method: isPoc ? 'POST' : 'DELETE', headers: json, body: JSON.stringify({ username }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? `Failed: ${res.status}`); }
}

// ---- Private note ----
export async function getMyCommunityNote(communityId: string, username: string): Promise<CommunityNote | null> {
  const res = await fetch(`${NOTES_API}/api/communities/${communityId}/notes?username=${encodeURIComponent(username)}`, { cache: 'no-store' });
  return ok(res, 'Failed to load note');
}
export async function postCommunityNote(communityId: string, username: string, comment: string): Promise<CommunityNote> {
  const res = await fetch(`${NOTES_API}/api/communities/${communityId}/notes`, { method: 'POST', headers: json, body: JSON.stringify({ username, comment }) });
  return ok(res, 'Failed to save note');
}
export async function patchCommunityNote(noteId: string, username: string, comment: string): Promise<CommunityNote> {
  const res = await fetch(`${NOTES_API}/api/communities/notes/${noteId}`, { method: 'PATCH', headers: json, body: JSON.stringify({ username, comment }) });
  return ok(res, 'Failed to update note');
}
export async function deleteCommunityNote(noteId: string, username: string): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/communities/notes/${noteId}`, { method: 'DELETE', headers: json, body: JSON.stringify({ username }) });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? `Failed: ${res.status}`); }
}

// ---- Headlines ----
export async function getCommunityHeadlines(communityId: string): Promise<CommunityHeadline[]> {
  const res = await fetch(`${NOTES_API}/api/communities/${communityId}/headlines`, { cache: 'no-store' });
  return ok(res, 'Failed to load headlines');
}
export async function postCommunityHeadline(communityId: string, username: string, title: string, body: string): Promise<CommunityHeadline> {
  const res = await fetch(`${NOTES_API}/api/communities/${communityId}/headlines`, { method: 'POST', headers: json, body: JSON.stringify({ username, title, body }) });
  return ok(res, 'Failed to save headline');
}
export async function patchCommunityHeadline(headlineId: string, username: string, title: string, body: string): Promise<CommunityHeadline> {
  const res = await fetch(`${NOTES_API}/api/communities/headlines/${headlineId}`, { method: 'PATCH', headers: json, body: JSON.stringify({ username, title, body }) });
  return ok(res, 'Failed to update headline');
}
export async function deleteCommunityHeadline(headlineId: string, username: string): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/communities/headlines/${headlineId}`, { method: 'DELETE', headers: json, body: JSON.stringify({ username }) });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? `Failed: ${res.status}`); }
}

// ---- Meetings (calendar) ----
export async function getCommunityMeetings(communityId: string): Promise<CommunityMeeting[]> {
  const res = await fetch(`${NOTES_API}/api/communities/${communityId}/meetings`, { cache: 'no-store' });
  return ok(res, 'Failed to load meetings');
}

// ---- Tagged contact IDs (existing endpoint) ----
export async function getCommunityContactIds(communityId: string): Promise<string[]> {
  const res = await fetch(`${NOTES_API}/api/communities/${communityId}/contacts`, { cache: 'no-store' });
  return ok(res, 'Failed to load contacts');
}
