'use client';

import { useId } from 'react';
import {
  MAX_PURPOSES, PURPOSE_OPTIONS, OUTCOME_OPTIONS, SIGNIFICANT_OPTIONS,
  assessmentLabel, type AssessmentOption,
} from '@/libs/meetingAssessmentConfig';
import type { MeetingAssessment } from '@/types/meetingAssessment';

// ---------------------------------------------------------------------------
// One step: heading + checkbox list
// ---------------------------------------------------------------------------
function Step({
  number, title, hint, options, isChecked, isDisabled, onToggle, locked, lockedText, idPrefix,
}: {
  number: number;
  title: string;
  hint: string;
  options: AssessmentOption[];
  isChecked: (code: string) => boolean;
  isDisabled: (code: string) => boolean;
  onToggle: (code: string) => void;
  locked: boolean;
  lockedText: string;
  idPrefix: string;
}) {
  return (
    <div className={`bg-white rounded border p-2 h-100 ${locked ? 'opacity-50' : ''}`}>
      <div className="d-flex align-items-baseline gap-2 mb-1">
        <span className="badge bg-primary rounded-pill">{number}</span>
        <span className="small fw-semibold">{title}</span>
      </div>
      <div className="text-muted mb-2" style={{ fontSize: '0.7rem' }}>
        {locked ? lockedText : hint}
      </div>
      {options.map((o) => {
        const id = `${idPrefix}-${o.code}`;
        return (
          <div className="form-check" key={o.code}>
            <input
              id={id}
              type="checkbox"
              className="form-check-input"
              checked={isChecked(o.code)}
              disabled={locked || isDisabled(o.code)}
              onChange={() => onToggle(o.code)}
            />
            <label className="form-check-label small" htmlFor={id}>{o.label}</label>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editor — controlled; parent owns the value
// ---------------------------------------------------------------------------
/**
 * 3-step meeting assessment.
 *  Step 1: up to 2 purposes
 *  Step 2: one outcome — enabled once Step 1 has a selection
 *  Step 3: any significant outcomes — enabled once Step 2 is set
 * Clearing a step also clears the steps after it, so a dependent answer can
 * never be saved without the answer it depends on.
 *
 *   <MeetingAssessmentEditor value={assessment} onChange={setAssessment} disabled={isSaving} />
 */
export function MeetingAssessmentEditor({
  value, onChange, disabled = false,
}: {
  value: MeetingAssessment;
  onChange: (value: MeetingAssessment) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const step2Locked = disabled || value.purposes.length === 0;
  const step3Locked = disabled || value.outcome === null;
  const purposesFull = value.purposes.length >= MAX_PURPOSES;

  function togglePurpose(code: string) {
    const purposes = value.purposes.includes(code)
      ? value.purposes.filter((c) => c !== code)
      : [...value.purposes, code];
    // No purposes left → later steps no longer apply
    onChange(purposes.length === 0 ? { purposes, outcome: null, significant: [] } : { ...value, purposes });
  }

  function toggleOutcome(code: string) {
    // Single-select: ticking another replaces it; unticking the current clears it
    const outcome = value.outcome === code ? null : code;
    onChange(outcome === null ? { ...value, outcome, significant: [] } : { ...value, outcome });
  }

  function toggleSignificant(code: string) {
    const significant = value.significant.includes(code)
      ? value.significant.filter((c) => c !== code)
      : [...value.significant, code];
    onChange({ ...value, significant });
  }

  return (
    <div className="row g-2 mt-1">
      <div className="col-12 col-md-4">
        <Step
          number={1}
          title="Primary engagement purpose"
          hint={`Select up to ${MAX_PURPOSES} (${value.purposes.length}/${MAX_PURPOSES})`}
          options={PURPOSE_OPTIONS}
          isChecked={(c) => value.purposes.includes(c)}
          isDisabled={(c) => purposesFull && !value.purposes.includes(c)}
          onToggle={togglePurpose}
          locked={disabled}
          lockedText=""
          idPrefix={`${id}-p`}
        />
      </div>
      <div className="col-12 col-md-4">
        <Step
          number={2}
          title="Outcome against primary purpose"
          hint="Select one"
          options={OUTCOME_OPTIONS}
          isChecked={(c) => value.outcome === c}
          isDisabled={() => false}
          onToggle={toggleOutcome}
          locked={step2Locked}
          lockedText={disabled ? '' : 'Complete step 1 first'}
          idPrefix={`${id}-o`}
        />
      </div>
      <div className="col-12 col-md-4">
        <Step
          number={3}
          title="Significant outcomes"
          hint="Select all that apply"
          options={SIGNIFICANT_OPTIONS}
          isChecked={(c) => value.significant.includes(c)}
          isDisabled={() => false}
          onToggle={toggleSignificant}
          locked={step3Locked}
          lockedText={disabled ? '' : 'Complete step 2 first'}
          idPrefix={`${id}-s`}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Read-only summary for view mode — renders nothing if no assessment
// ---------------------------------------------------------------------------
export function MeetingAssessmentSummary({ value }: { value: MeetingAssessment }) {
  if (value.purposes.length === 0) return null;

  return (
    <div className="bg-white rounded border p-2 mt-2 small">
      <div className="d-flex flex-wrap align-items-center gap-1 mb-1">
        <span className="text-muted me-1">Purpose:</span>
        {value.purposes.map((c) => (
          <span key={c} className="badge bg-primary bg-opacity-75 rounded-pill">{assessmentLabel(c)}</span>
        ))}
        {value.outcome && (
          <>
            <span className="text-muted ms-2 me-1">Outcome:</span>
            <span className={`badge rounded-pill ${
              value.outcome === 'not_achieved' ? 'bg-danger'
              : value.outcome === 'partially_achieved' ? 'bg-warning text-dark'
              : 'bg-success'
            }`}>
              {assessmentLabel(value.outcome)}
            </span>
          </>
        )}
      </div>
      {value.significant.length > 0 && (
        <div className="d-flex flex-wrap align-items-center gap-1">
          <span className="text-muted me-1">Significant:</span>
          {value.significant.map((c) => (
            <span key={c} className="badge bg-light text-dark border rounded-pill">{assessmentLabel(c)}</span>
          ))}
        </div>
      )}
    </div>
  );
}
