import { NextRequest, NextResponse } from 'next/server';
import { listActiveLookup } from '@/libs/adminLookupRepository';
import type { LookupKind } from '@/types/adminLookup';

// Public reference endpoint — tags & areas only (teams stay admin-listed).
// Any authenticated user can read; returns ACTIVE rows only.
const PUBLIC_KINDS: LookupKind[] = ['tags', 'areas'];

/** GET /api/lookup/:kind — active rows, name + description */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ kind: string }> }
) {
  const rawKind = (await params).kind;
  const kind = (PUBLIC_KINDS as string[]).includes(rawKind)
    ? (rawKind as LookupKind) : null;

  if (!kind) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Unknown lookup table.' }, { status: 400 });
  }

  try {
    return NextResponse.json({ data: await listActiveLookup(kind) });
  } catch (err) {
    console.error(`GET /api/lookup/${kind} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 });
  }
}
