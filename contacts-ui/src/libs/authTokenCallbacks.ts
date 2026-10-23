// SERVER ONLY. Drop-in pieces for your existing NextAuth authOptions.
//
//   callbacks: {
//     async jwt({ token, account, profile }) {
//       // …your existing roles / username logic stays here…
//       return keepKeycloakTokenFresh(token, account);
//     },
//     async session({ session, token }) {
//       // …your existing session logic…
//       session.error = token.error;   // a flag only — NEVER copy accessToken/refreshToken here:
//       return session;                // the session is readable by the browser at /api/auth/session
//     },
//   }

import type { Account } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { isExpired, refreshKeycloakToken } from './keycloakToken';

/**
 * On sign-in: store Keycloak's tokens inside the (encrypted, httpOnly) JWT cookie.
 * Afterwards: refresh the access token when it's near expiry.
 */
export async function keepKeycloakTokenFresh(
  token: JWT, account?: Account | null
): Promise<JWT> {
  // First call after sign-in — account is only present now
  if (account?.provider === 'keycloak' && account.access_token) {
    return {
      ...token,
      accessToken: account.access_token,
      refreshToken: account.refresh_token,
      accessTokenExpires: account.expires_at
        ? account.expires_at * 1000             // Keycloak gives seconds
        : Date.now() + 5 * 60 * 1000,
      error: undefined,
    };
  }

  // No Keycloak token (GitHub dev login / demo bypass) — nothing to refresh
  if (!token.accessToken || !token.refreshToken) return token;

  if (!isExpired(token)) return token;

  try {
    const fresh = await refreshKeycloakToken(token.refreshToken);
    return { ...token, ...fresh, error: undefined };
  } catch (err) {
    console.error('Keycloak token refresh failed:', err);
    return { ...token, accessToken: undefined, error: 'RefreshAccessTokenError' };
  }
}
