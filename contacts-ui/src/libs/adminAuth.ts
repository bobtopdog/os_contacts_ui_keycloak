import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Server-side admin gate for API routes.
 * Returns the username if the caller has the 'admin' role, otherwise null.
 *
 * IMPORTANT: this is the REAL access control — the UI hiding the /admin page
 * is cosmetic. Every admin API route must call this.
 *
 * Adjust ADMIN_ROLE if your Keycloak realm uses a different role name.
 */
const ADMIN_ROLE = 'admin';

export async function requireAdmin(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const roles: string[] = (session.user as { roles?: string[] }).roles ?? [];
  if (!roles.includes(ADMIN_ROLE)) return null;

  return (session.user as { username?: string }).username ?? null;
}
