import { NextRequest, NextResponse } from 'next/server';
import type { DirectoryUser } from '@/types/directory';

/**
 * GET /api/users/:username/directory
 * Server-side proxy to the corporate user directory. Keeps the directory URL
 * and any auth token off the browser, avoids CORS, and benefits from
 * NODE_EXTRA_CA_CERTS for the directory's certificate.
 *
 * Env:
 *   DIRECTORY_API_BASE_URL  e.g. https://<host>:8443/rest/v3   (required)
 *   DIRECTORY_API_TOKEN     optional bearer token
 */
export async function GET(_r: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const u = decodeURIComponent((await params).username).trim();
  if (!u || !/^[A-Za-z0-9._-]+$/.test(u)) {
    return NextResponse.json({ error: 'Bad Request', message: 'Invalid username.' }, { status: 400 });
  }

  const base = process.env.DIRECTORY_API_BASE_URL;
  if (!base) {
    return NextResponse.json({ error: 'Not Configured', message: 'DIRECTORY_API_BASE_URL is not set.' }, { status: 503 });
  }

  const notFound: DirectoryUser = { username: u, firstname: '', lastname: '', telephoneNumber: '', email: '', found: false };

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/users/${encodeURIComponent(u)}/infoplus`, {
      headers: {
        Accept: 'application/json',
        ...(process.env.DIRECTORY_API_TOKEN ? { Authorization: `Bearer ${process.env.DIRECTORY_API_TOKEN}` } : {}),
      },
      // Directory data changes rarely — let Next cache it server-side for 10 minutes
      next: { revalidate: 600 },
    });

    if (res.status === 404) return NextResponse.json({ data: notFound });
    if (!res.ok) {
      console.error(`Directory API ${res.status} for ${u}`);
      return NextResponse.json({ error: 'Upstream Error', message: `Directory returned ${res.status}` }, { status: 502 });
    }

    const raw = await res.json();
    // Some services wrap the record — accept either shape
    const r = raw?.data ?? raw;

    const user: DirectoryUser = {
      username: u,
      firstname: r.firstname ?? '',
      lastname: r.lastname ?? '',
      telephoneNumber: r.telephoneNumber ?? '',
      email: r.email ?? '',
      found: !!(r.firstname || r.lastname),
    };
    return NextResponse.json({ data: user });
  } catch (err) {
    console.error(`Directory lookup failed for ${u}:`, err);
    return NextResponse.json({ error: 'Upstream Error', message: 'Could not reach the directory service.' }, { status: 502 });
  }
}
