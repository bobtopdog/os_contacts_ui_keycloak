import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAboutMe, upsertAboutMe } from '@/libs/userProfileRepository';

const MAX_LENGTH = 2000;
type Ctx = { params: Promise<{ username: string }> };

/** GET /api/users/:username/about */
export async function GET(_r: NextRequest, { params }: Ctx) {
  const u = decodeURIComponent((await params).username).trim();
  if (!u) return NextResponse.json({ error: 'Bad Request', message: 'username is required.' }, { status: 400 });
  try {
    return NextResponse.json({ data: { username: u, aboutMe: await getAboutMe(u) } });
  } catch (err) {
    console.error('GET about error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}

/**
 * PUT /api/users/:username/about   Body: { aboutMe }
 * Users may only edit their OWN text — verified against the server session,
 * not a body field, since this is personal content.
 */
export async function PUT(request: NextRequest, { params }: Ctx) {
  const u = decodeURIComponent((await params).username).trim();
  const session = await getServerSession(authOptions);
  const me = (session?.user as { username?: string } | undefined)?.username;
  if (!me || me !== u) {
    return NextResponse.json({ error: 'Forbidden', message: 'You can only edit your own profile.' }, { status: 403 });
  }

  let body: { aboutMe?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Bad Request', message: 'Invalid JSON body' }, { status: 400 }); }
  const aboutMe = (body.aboutMe ?? '').trim();
  if (aboutMe.length > MAX_LENGTH) {
    return NextResponse.json({ error: 'Bad Request', message: `About me must be ${MAX_LENGTH} characters or fewer.` }, { status: 400 });
  }

  try {
    await upsertAboutMe(u, aboutMe);
    return NextResponse.json({ data: { username: u, aboutMe } });
  } catch (err) {
    console.error('PUT about error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}
