import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/libs/adminAuth';
import { createSubOutcome, isDuplicateCode } from '@/libs/outcomeAdminRepository';
import { parseOutcomeInput } from '@/libs/outcomeAdminInput';

/** POST /api/admin/sub-outcomes — Body: { outcomeId, code, label, sortOrder } */
export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden', message: 'Admin role required.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Bad Request', message: 'Invalid JSON body' }, { status: 400 });
  }

  const outcomeId = Number(body.outcomeId);
  if (!Number.isInteger(outcomeId) || outcomeId <= 0) {
    return NextResponse.json({ error: 'Bad Request', message: 'A valid outcomeId is required.' }, { status: 400 });
  }

  const parsed = parseOutcomeInput(body, true);
  if ('error' in parsed) {
    return NextResponse.json({ error: 'Bad Request', message: parsed.error }, { status: 400 });
  }

  try {
    const { code, label, sortOrder } = parsed.value;
    const subOutcomeId = await createSubOutcome(outcomeId, code, label, sortOrder);
    return NextResponse.json({ data: { subOutcomeId } }, { status: 201 });
  } catch (err) {
    if (isDuplicateCode(err)) {
      return NextResponse.json(
        { error: 'Conflict', message: 'That code is already in use.' }, { status: 409 });
    }
    if ((err as { code?: string })?.code === '23503') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Parent outcome not found.' }, { status: 400 });
    }
    console.error('POST /api/admin/sub-outcomes error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}
