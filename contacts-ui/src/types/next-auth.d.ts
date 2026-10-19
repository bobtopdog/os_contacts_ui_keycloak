import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username: string;
      roles: string[];
      accessToken?: string;
    };
    //rawClaims?: Record<string, unknown>;
    accessToken?: string;
  }
}
/* declare module 'next-auth/jwt' {
  interface JWT {
    username?: string;
    rawClaims?: Record<string, unknown>
    accessToken?: string
  }
} */
