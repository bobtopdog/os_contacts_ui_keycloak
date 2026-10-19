import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/libs/adminAuth';
import { updateSubOutcome } from '@/libs/outcomeAdminRepository';
import { parseOutcomeInput, parseIntId } from '@/libs/outcomeAdminInput';

/**
 * PATCH /api/admin/sub-outcomes/:id — Body: { label, sortOrder, active }
 * Code and parent outcome are fixed after creation. No DELETE by design.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden', message: 'Admin role required.' }, { status: 403 });
  }

  const subOutcomeId = parseIntId((await params).id);
  if (!subOutcomeId) {
    return NextResponse.json({ error: 'Bad Request', message: 'Invalid sub-outcome ID.' }, { status: 400 });
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
    const ok = await updateSubOutcome(subOutcomeId, label, sortOrder, active);
    if (!ok) {
      return NextResponse.json({ error: 'Not Found', message: 'Sub-outcome not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`PATCH /api/admin/sub-outcomes/${subOutcomeId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}
