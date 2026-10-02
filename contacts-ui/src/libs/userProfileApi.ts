import type { UserSummary } from '@/types/userProfile';

const NOTES_API = process.env.NEXT_PUBLIC_NOTES_API_URL ?? 'http://localhost:3000';

export async function getUserSummary(username: string): Promise<UserSummary> {
  const res = await fetch(`${NOTES_API}/api/users/${encodeURIComponent(username)}/summary`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load user summary: ${res.status}`);
  return (await res.json()).data;
}

export async function getAboutMe(username: string): Promise<string> {
  const res = await fetch(`${NOTES_API}/api/users/${encodeURIComponent(username)}/about`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load about me: ${res.status}`);
  return (await res.json()).data.aboutMe;
}

export async function saveAboutMe(username: string, aboutMe: string): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/users/${encodeURIComponent(username)}/about`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ aboutMe }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to save: ${res.status}`);
  }
}
