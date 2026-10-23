// SERVER ONLY — imports next/headers. Never import from a 'use client' file
// (or from api.ts, which client components import).
import { cookies, headers } from 'next/headers';
import { getToken, type JWT } from 'next-auth/jwt';

const EXPIRY_MARGIN_MS = 60_000;   // refresh a minute early so a call never lands on an expired token

export interface RefreshedTokens {
  accessToken: string;
  accessTokenExpires: number;      // epoch ms
  refreshToken: string;
}

/**
 * Exchange a Keycloak refresh token for a new access token.
 * Used by the NextAuth jwt callback and, as a fallback, by getAccessToken().
 */
export async function refreshKeycloakToken(refreshToken: string): Promise<RefreshedTokens> {
  const res = await fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.KEYCLOAK_CLIENT_ID ?? '',
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET ?? '',
      refresh_token: refreshToken,
    }),
    cache: 'no-store',
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    throw new Error(`Keycloak refresh failed: ${res.status} ${body.error ?? ''}`.trim());
  }

  return {
    accessToken: body.access_token,
    accessTokenExpires: Date.now() + (body.expires_in ?? 300) * 1000,
    // Keycloak may rotate the refresh token; fall back to the old one if not
    refreshToken: body.refresh_token ?? refreshToken,
  };
}

/** True if the stored access token is missing or about to expire. */
export function isExpired(token: JWT): boolean {
  const exp = token.accessTokenExpires;
  return !token.accessToken || !exp || Date.now() > exp - EXPIRY_MARGIN_MS;
}

/**
 * The signed-in user's Keycloak access token, for calling the live contacts
 * service on their behalf. Works in server components AND route handlers.
 *
 * Reads the encrypted NextAuth session cookie directly (getToken reassembles
 * chunked cookies — Keycloak sessions often exceed the 4 KB cookie limit).
 * The token never goes to the browser.
 *
 * Returns null when there's no session, or no Keycloak token (e.g. the demo
 * bypass or GitHub sign-in in dev).
 */
export async function getAccessToken(): Promise<string | null> {
  const req = { cookies: await cookies(), headers: await headers() };
  const token = await getToken({ req: req as unknown as Parameters<typeof getToken>[0]['req'] });
  if (!token?.accessToken) return null;

  if (!isExpired(token)) return token.accessToken;

  // Normally the jwt callback has already refreshed it (the browser's session
  // polling persists the new token). This covers a request that arrives
  // first — it refreshes for THIS request only; the cookie is updated on the
  // next session poll.
  if (!token.refreshToken) return null;
  try {
    return (await refreshKeycloakToken(token.refreshToken)).accessToken;
  } catch (err) {
    console.error('Access token refresh failed:', err);
    return null;
  }
}
