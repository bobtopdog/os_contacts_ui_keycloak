import { NextRequest, NextResponse } from 'next/server';
import { getUserSummary } from '@/libs/userProfileRepository';

/** GET /api/users/:username/summary — about me, PoC contacts, latest activity */
export async function GET(_r: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const u = decodeURIComponent(username).trim();
  if (!u) return NextResponse.json({ error: 'Bad Request', message: 'username is required.' }, { status: 400 });
  try {
    return NextResponse.json({ data: await getUserSummary(u) });
  } catch (err) {
    console.error('GET user summary error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}
