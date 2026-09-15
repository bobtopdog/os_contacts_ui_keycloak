import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/libs/adminAuth';
import { listLookup, createLookup } from '@/libs/adminLookupRepository';
import type { LookupKind } from '@/types/adminLookup';

const KINDS: LookupKind[] = ['tags', 'areas', 'teams'];

function parseKind(kind: string): LookupKind | null {
  return (KINDS as string[]).includes(kind) ? (kind as LookupKind) : null;
}

/** GET /api/admin/:kind — list ALL rows (admin only, includes inactive) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ kind: string }> }
) {
  const kind = parseKind((await params).kind);
  if (!kind) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Unknown lookup table.' }, { status: 400 });
  }

  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Admin role required.' }, { status: 403 });
  }

  try {
    return NextResponse.json({ data: await listLookup(kind) });
  } catch (err) {
    console.error(`GET /api/admin/${kind} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 });
  }
}

/** POST /api/admin/:kind — create. Body: { name, description, intranetUrl? } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ kind: string }> }
) {
  const kind = parseKind((await params).kind);
  if (!kind) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Unknown lookup table.' }, { status: 400 });
  }

  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Admin role required.' }, { status: 403 });
  }

  let body: { name?: string; description?: string; intranetUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'name is required.' }, { status: 400 });
  }

  try {
    const item = await createLookup(
      kind, body.name.trim(), body.description?.trim() ?? '', body.intranetUrl?.trim());
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err) {
    console.error(`POST /api/admin/${kind} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 });
  }
}
