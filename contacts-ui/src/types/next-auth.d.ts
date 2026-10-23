import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username: string;
      roles: string[];
    };
    //rawClaims?: Record<string, unknown>;
  }
}
/* declare module 'next-auth/jwt' {
  interface JWT {
    username?: string;
    rawClaims?: Record<string, unknown>
  }
} */
