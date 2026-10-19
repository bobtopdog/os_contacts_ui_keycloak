import type { OutcomeInput } from '@/types/outcomeAdmin';

const CODE_PATTERN = /^[A-Za-z0-9._-]{1,50}$/;

/**
 * Validates an outcome / sub-outcome body for the admin routes.
 * `requireCode` is true on create (codes can't be changed afterwards).
 */
export function parseOutcomeInput(
  body: Partial<Record<keyof OutcomeInput, unknown>>,
  requireCode: boolean
): { value: Required<OutcomeInput> } | { error: string } {
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  const sortOrder = Number(body.sortOrder ?? 0);
  const active = body.active === undefined ? true : body.active;

  if (requireCode && !CODE_PATTERN.test(code)) {
    return { error: 'Code is required: up to 50 letters, numbers, dots, dashes or underscores.' };
  }
  if (!label || label.length > 255) {
    return { error: 'Label is required (up to 255 characters).' };
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
    return { error: 'Sort order must be a whole number between 0 and 9999.' };
  }
  if (typeof active !== 'boolean') {
    return { error: 'active must be true or false.' };
  }
  return { value: { code, label, sortOrder, active } };
}

export function parseIntId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}
