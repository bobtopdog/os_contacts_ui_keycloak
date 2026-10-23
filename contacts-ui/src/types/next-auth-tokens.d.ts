// Kept in its own file on purpose: TypeScript merges these interfaces with
// your existing next-auth.d.ts (roles, username…), so nothing there changes.
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth/jwt' {
  interface JWT {
    /** Keycloak access token — sent as the Bearer to the live contacts service. */
    accessToken?: string;
    /** Epoch ms when accessToken expires. */
    accessTokenExpires?: number;
    refreshToken?: string;
    /** Set when a refresh failed; the client should sign in again. */
    error?: 'RefreshAccessTokenError';
  }
}

declare module 'next-auth' {
  interface Session {
    /** Safe to expose: just a flag, never the token itself. */
    error?: 'RefreshAccessTokenError';
  }
}
