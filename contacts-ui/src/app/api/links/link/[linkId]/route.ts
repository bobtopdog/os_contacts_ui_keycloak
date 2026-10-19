import { NextRequest, NextResponse } from 'next/server';
import { updateLink, deleteLink } from '@/libs/linksRepository';
import { parseOutcome, isOutcomeFkError } from '@/libs/outcomeValidation';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Ctx = { params: Promise<{ linkId: string }> };


/**
 * PATCH /api/links/link/:linkId
 * Body: { username, reference, label, outcomeId?, subOutcomeId? }
 *
 * NOTE: this replaces the outcome pair every time. The client must always
 * send the current outcome values, otherwise they're cleared — which is
 * exactly what was happening before (patchLink never sent them).
 */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { linkId } = await params;
  if (!UUID.test(linkId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid link ID.' }, { status: 400 });
  }

  let body: {
    username?: string; reference?: string; label?: string;
    outcomeId?: number | null; subOutcomeId?: number | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' }, { status: 400 });
  }

  const username = body.username?.trim() ?? '';
  const reference = body.reference?.trim() ?? '';
  const label = body.label?.trim() ?? '';

  if (!username || !reference) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username and reference are required.' }, { status: 400 });
  }

  const outcome = parseOutcome(body.outcomeId, body.subOutcomeId);
  if ('error' in outcome) {
    return NextResponse.json(
      { error: 'Bad Request', message: outcome.error }, { status: 400 });
  }

  try {
    const link = await updateLink(
      linkId, username, reference, label,
      outcome.outcomeId, outcome.subOutcomeId
    );
    if (!link) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Link not found or you are not the owner.' },
        { status: 403 });
    }
    return NextResponse.json({ data: link });
  } catch (err) {
    if (isOutcomeFkError(err)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'That sub-outcome does not belong to the chosen outcome.' },
        { status: 400 });
    }
    console.error(`PATCH /api/links/link/${linkId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 });
  }
}

/** DELETE /api/links/link/:linkId — Body: { username } (unchanged) */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { linkId } = await params;
  if (!UUID.test(linkId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid link ID.' }, { status: 400 });
  }

  let username = '';
  try {
    username = ((await request.json()).username as string)?.trim() ?? '';
  } catch { /* handled below */ }
  if (!username) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username is required.' }, { status: 400 });
  }

  try {
    const ok = await deleteLink(linkId, username);
    if (!ok) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Link not found or you are not the owner.' },
        { status: 403 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`DELETE /api/links/link/${linkId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 });
  }
}
