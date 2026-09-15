import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/libs/adminAuth';
import { updateLookup } from '@/libs/adminLookupRepository';
import type { LookupKind } from '@/types/adminLookup';

const KINDS: LookupKind[] = ['tags', 'areas', 'teams'];

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * PATCH /api/admin/:kind/:id
 * Body: { name, description, active, intranetUrl? }
 * No DELETE handler exists by design — rows are deactivated, never removed.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ kind: string; id: string }> }
) {
  const { kind: rawKind, id } = await params;
  const kind = (KINDS as string[]).includes(rawKind) ? (rawKind as LookupKind) : null;

  if (!kind || !isValidUuid(id)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Unknown lookup table or invalid ID.' },
      { status: 400 });
  }

  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Admin role required.' }, { status: 403 });
  }

  let body: { name?: string; description?: string; active?: boolean; intranetUrl?: string };
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
  if (typeof body.active !== 'boolean') {
    return NextResponse.json(
      { error: 'Bad Request', message: 'active must be a boolean.' }, { status: 400 });
  }

  try {
    const item = await updateLookup(
      kind, id, body.name.trim(), body.description?.trim() ?? '',
      body.active, body.intranetUrl?.trim());

    if (!item) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Row not found.' }, { status: 404 });
    }
    return NextResponse.json({ data: item });
  } catch (err) {
    console.error(`PATCH /api/admin/${kind}/${id} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 });
  }
}
