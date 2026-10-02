'use client';

import { useQuery } from '@tanstack/react-query';
import type { DirectoryUser } from '@/types/directory';

const NOTES_API = process.env.NEXT_PUBLIC_NOTES_API_URL ?? 'http://localhost:3000';

async function fetchDirectoryUser(username: string): Promise<DirectoryUser> {
  const res = await fetch(`${NOTES_API}/api/users/${encodeURIComponent(username)}/directory`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Directory lookup failed: ${res.status}`);
  return (await res.json()).data;
}

/**
 * Resolves a username to real name / phone / email via the corporate
 * directory (through our proxy route). Cached 30 min per username, so a
 * page with the same person in ten places makes one request.
 */
export function useDirectoryUser(username: string) {
  return useQuery<DirectoryUser>({
    queryKey: ['directory-user', username],
    queryFn: () => fetchDirectoryUser(username),
    enabled: !!username,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

/** "John Smith" if known, otherwise the raw username. */
export function displayName(d: DirectoryUser | undefined, username: string) {
  if (!d?.found) return username;
  return `${d.firstname} ${d.lastname}`.trim() || username;
}
