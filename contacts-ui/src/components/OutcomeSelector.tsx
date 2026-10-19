'use client';

import { useId } from 'react';
import { useOutcomes } from '@/hooks/useOutcomes';
import type { OutcomeValue } from '@/types/outcome';

interface Props {
  value: OutcomeValue;
  onChange: (value: OutcomeValue) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Cascading Outcome → Sub-outcome dropdowns. Both optional.
 *  - Sub-outcome is disabled until an outcome is chosen
 *  - Changing the outcome clears the sub-outcome
 *  - Inactive values are hidden from new choices, but if a record already
 *    uses one (when editing) it stays visible and selected, marked "(retired)"
 *
 * Controlled component — the parent form owns the value:
 *   const [outcome, setOutcome] = useState<OutcomeValue>(EMPTY_OUTCOME);
 *   <OutcomeSelector value={outcome} onChange={setOutcome} disabled={isSaving} />
 */
export default function OutcomeSelector({ value, onChange, disabled = false, size = 'sm' }: Props) {
  const id = useId();
  const { data: outcomes, isLoading, isError } = useOutcomes();
  const cls = size === 'sm' ? 'form-select form-select-sm' : 'form-select';

  const visibleOutcomes = (outcomes ?? []).filter(
    (o) => o.active || o.outcomeId === value.outcomeId
  );
  const selected = outcomes?.find((o) => o.outcomeId === value.outcomeId);
  const visibleSubs = (selected?.subs ?? []).filter(
    (s) => s.active || s.subOutcomeId === value.subOutcomeId
  );

  function handleOutcome(raw: string) {
    // Any change to the outcome clears the dependent sub-outcome
    onChange({ outcomeId: raw ? parseInt(raw, 10) : null, subOutcomeId: null });
  }

  function handleSub(raw: string) {
    onChange({ ...value, subOutcomeId: raw ? parseInt(raw, 10) : null });
  }

  if (isError) {
    return <div className="text-muted small">Outcomes unavailable.</div>;
  }

  const subDisabled = disabled || isLoading || value.outcomeId === null || visibleSubs.length === 0;

  return (
    <div className="row g-2">
      <div className="col-12 col-md-6">
        <label htmlFor={`${id}-o`} className="form-label small fw-medium mb-1">
          Force Outcome <span className="text-muted fw-normal">(optional)</span>
        </label>
        <select
          id={`${id}-o`}
          className={cls}
          value={value.outcomeId ?? ''}
          onChange={(e) => handleOutcome(e.target.value)}
          disabled={disabled || isLoading}
        >
          <option value="">{isLoading ? 'Loading…' : 'No outcome'}</option>
          {visibleOutcomes.map((o) => (
            <option key={o.outcomeId} value={o.outcomeId}>
              {o.label}{!o.active ? ' (retired)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="col-12 col-md-6">
        <label htmlFor={`${id}-s`} className="form-label small fw-medium mb-1">
          Campaigns <span className="text-muted fw-normal">(optional)</span>
        </label>
        <select
          id={`${id}-s`}
          className={cls}
          value={value.subOutcomeId ?? ''}
          onChange={(e) => handleSub(e.target.value)}
          disabled={subDisabled}
          title={value.outcomeId === null ? 'Choose an outcome first' : undefined}
        >
          <option value="">
            {value.outcomeId === null ? 'Choose an outcome first' : 'No sub-outcome'}
          </option>
          {visibleSubs.map((s) => (
            <option key={s.subOutcomeId} value={s.subOutcomeId}>
              {s.label}{!s.active ? ' (retired)' : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
