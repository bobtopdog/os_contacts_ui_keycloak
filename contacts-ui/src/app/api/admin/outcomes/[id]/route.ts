import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/libs/adminAuth';
import { updateOutcome } from '@/libs/outcomeAdminRepository';
import { parseOutcomeInput, parseIntId } from '@/libs/outcomeAdminInput';

/**
 * PATCH /api/admin/outcomes/:id — Body: { label, sortOrder, active }
 * The code is fixed after creation. No DELETE handler by design.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden', message: 'Admin role required.' }, { status: 403 });
  }

  const outcomeId = parseIntId((await params).id);
  if (!outcomeId) {
    return NextResponse.json({ error: 'Bad Request', message: 'Invalid outcome ID.' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Bad Request', message: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseOutcomeInput(body, false);
  if ('error' in parsed) {
    return NextResponse.json({ error: 'Bad Request', message: parsed.error }, { status: 400 });
  }

  try {
    const { label, sortOrder, active } = parsed.value;
    const ok = await updateOutcome(outcomeId, label, sortOrder, active);
    if (!ok) {
      return NextResponse.json({ error: 'Not Found', message: 'Outcome not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`PATCH /api/admin/outcomes/${outcomeId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}
