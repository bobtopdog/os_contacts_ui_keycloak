import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/libs/adminAuth';
import { getAdminOutcomeTree, createOutcome, isDuplicateCode } from '@/libs/outcomeAdminRepository';
import { parseOutcomeInput } from '@/libs/outcomeAdminInput';

const forbidden = () =>
  NextResponse.json({ error: 'Forbidden', message: 'Admin role required.' }, { status: 403 });

/** GET /api/admin/outcomes — full tree incl. inactive, with usage counts (admin only) */
export async function GET() {
  if (!(await requireAdmin())) return forbidden();
  try {
    return NextResponse.json({ data: await getAdminOutcomeTree() });
  } catch (err) {
    console.error('GET /api/admin/outcomes error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}

/** POST /api/admin/outcomes — Body: { code, label, sortOrder } */
export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return forbidden();

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Bad Request', message: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseOutcomeInput(body, true);
  if ('error' in parsed) {
    return NextResponse.json({ error: 'Bad Request', message: parsed.error }, { status: 400 });
  }

  try {
    const { code, label, sortOrder } = parsed.value;
    const outcomeId = await createOutcome(code, label, sortOrder);
    return NextResponse.json({ data: { outcomeId } }, { status: 201 });
  } catch (err) {
    if (isDuplicateCode(err)) {
      return NextResponse.json(
        { error: 'Conflict', message: 'That code is already in use.' }, { status: 409 });
    }
    console.error('POST /api/admin/outcomes error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}
