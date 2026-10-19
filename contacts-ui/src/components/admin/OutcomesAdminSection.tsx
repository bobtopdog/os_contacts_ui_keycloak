'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminOutcome, AdminSubOutcome } from '@/types/outcomeAdmin';

const NOTES_API = process.env.NEXT_PUBLIC_NOTES_API_URL ?? 'http://localhost:3000';

// ---------------------------------------------------------------------------
// API helpers (admin-only routes; the server checks the role)
// ---------------------------------------------------------------------------
async function send(path: string, method: 'POST' | 'PATCH', body: unknown): Promise<void> {
  const res = await fetch(`${NOTES_API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Request failed: ${res.status}`);
  }
}

async function fetchTree(): Promise<AdminOutcome[]> {
  const res = await fetch(`${NOTES_API}/api/admin/outcomes`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load outcomes: ${res.status}`);
  return (await res.json()).data;
}

function useRefresh() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin-outcomes'] });
    // The user-facing dropdowns cache for 30 min — refresh them too
    queryClient.invalidateQueries({ queryKey: ['lookup-outcomes'] });
  };
}

// ---------------------------------------------------------------------------
// "New item" form — shared by outcomes and sub-outcomes
// ---------------------------------------------------------------------------
function NewItemForm({
  title, defaultSort, onSave, onCancel,
}: {
  title: string;
  defaultSort: number;
  onSave: (v: { code: string; label: string; sortOrder: number }) => Promise<void>;
  onCancel: () => void;
}) {
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [sortOrder, setSortOrder] = useState(defaultSort);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setBusy(true); setError('');
    try { await onSave({ code: code.trim(), label: label.trim(), sortOrder }); }
    catch (err) { setError(err instanceof Error ? err.message : 'Save failed'); setBusy(false); }
  }

  return (
    <div className="card border-0 bg-light mb-2">
      <div className="card-body py-2">
        <div className="small fw-semibold mb-2">{title}</div>
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-3">
            <label className="form-label small mb-1">Code *</label>
            <input className="form-control form-control-sm" value={code} placeholder="e.g. Fo5"
              onChange={(e) => setCode(e.target.value)} disabled={busy} autoFocus />
          </div>
          <div className="col-12 col-md-5">
            <label className="form-label small mb-1">Label *</label>
            <input className="form-control form-control-sm" value={label}
              onChange={(e) => setLabel(e.target.value)} disabled={busy} />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small mb-1">Order</label>
            <input type="number" min={0} className="form-control form-control-sm" value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)} disabled={busy} />
          </div>
          <div className="col-6 col-md-2 d-flex gap-1">
            <button className="btn btn-outline-secondary btn-sm" onClick={onCancel} disabled={busy}>✕</button>
            <button className="btn btn-primary btn-sm flex-grow-1" onClick={save}
              disabled={!code.trim() || !label.trim() || busy}>
              {busy ? '…' : 'Add'}
            </button>
          </div>
        </div>
        <small className="text-muted d-block mt-1" style={{ fontSize: '0.7rem' }}>
          The code is permanent once saved — choose carefully. The label can be changed any time.
        </small>
        {error && <div className="alert alert-danger py-1 small mt-2 mb-0">{error}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editable row — label, order, active (code is read-only)
// ---------------------------------------------------------------------------
function EditableRow({
  code, label, sortOrder, active, usageCount, indent = false, onSave, extra,
}: {
  code: string;
  label: string;
  sortOrder: number;
  active: boolean;
  usageCount: number;
  indent?: boolean;
  onSave: (v: { label: string; sortOrder: number; active: boolean }) => Promise<void>;
  extra?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [l, setL] = useState(label);
  const [s, setS] = useState(sortOrder);
  const [a, setA] = useState(active);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function startEdit() {
    setL(label); setS(sortOrder); setA(active); setError(''); setEditing(true);
  }

  async function save() {
    setBusy(true); setError('');
    try { await onSave({ label: l.trim(), sortOrder: s, active: a }); setEditing(false); }
    catch (err) { setError(err instanceof Error ? err.message : 'Save failed'); }
    finally { setBusy(false); }
  }

  if (!editing) {
    return (
      <div className={`d-flex align-items-center gap-2 py-2 border-bottom ${active ? '' : 'text-muted'} ${indent ? 'ps-4' : ''}`}>
        <span className={`badge rounded-pill ${indent ? 'bg-secondary' : 'bg-dark'}`}>{code}</span>
        <span className={`flex-grow-1 ${indent ? 'small' : 'fw-semibold'}`}>{label}</span>
        <span className="small text-muted" title="Sort order">#{sortOrder}</span>
        <span className="small text-muted" title="Records using this value">
          {usageCount} use{usageCount !== 1 ? 's' : ''}
        </span>
        {active
          ? <span className="badge bg-success rounded-pill">active</span>
          : <span className="badge bg-secondary rounded-pill">inactive</span>}
        {extra}
        <button className="btn btn-outline-secondary btn-sm py-0" onClick={startEdit}>✏️</button>
      </div>
    );
  }

  return (
    <div className={`py-2 border-bottom ${indent ? 'ps-4' : ''}`}>
      <div className="row g-2 align-items-center">
        <div className="col-auto">
          <span className={`badge rounded-pill ${indent ? 'bg-secondary' : 'bg-dark'}`} title="Codes can't be changed">
            {code} 🔒
          </span>
        </div>
        <div className="col">
          <input className="form-control form-control-sm" value={l}
            onChange={(e) => setL(e.target.value)} disabled={busy} autoFocus />
        </div>
        <div className="col-3 col-md-2">
          <input type="number" min={0} className="form-control form-control-sm" value={s}
            onChange={(e) => setS(parseInt(e.target.value, 10) || 0)} disabled={busy} title="Sort order" />
        </div>
        <div className="col-auto form-check mb-0">
          <input type="checkbox" className="form-check-input" id={`act-${code}`} checked={a}
            onChange={(e) => setA(e.target.checked)} disabled={busy} />
          <label className="form-check-label small" htmlFor={`act-${code}`}>Active</label>
        </div>
        <div className="col-auto d-flex gap-1">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditing(false)} disabled={busy}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={!l.trim() || busy}>
            {busy ? '…' : 'Save'}
          </button>
        </div>
      </div>
      {active && !a && usageCount > 0 && (
        <div className="alert alert-warning py-1 small mt-2 mb-0">
          Deactivating hides this from new selections. The {usageCount} existing record
          {usageCount !== 1 ? 's' : ''} using it keep their value and still display it.
        </div>
      )}
      {error && <div className="alert alert-danger py-1 small mt-2 mb-0">{error}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// One outcome with its sub-outcomes
// ---------------------------------------------------------------------------
function OutcomeBlock({ outcome }: { outcome: AdminOutcome }) {
  const refresh = useRefresh();
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);

  const nextSubSort = outcome.subs.length
    ? Math.max(...outcome.subs.map((s) => s.sortOrder)) + 1
    : 0;

  return (
    <div className="card border-0 shadow-sm mb-2">
      <div className="card-body py-1 px-3">
        <EditableRow
          code={outcome.code}
          label={outcome.label}
          sortOrder={outcome.sortOrder}
          active={outcome.active}
          usageCount={outcome.usageCount}
          onSave={async (v) => {
            await send(`/api/admin/outcomes/${outcome.outcomeId}`, 'PATCH', v);
            refresh();
          }}
          extra={
            <button className="btn btn-outline-primary btn-sm py-0" onClick={() => setExpanded((x) => !x)}>
              {expanded ? '▲' : '▼'} {outcome.subs.length} sub
            </button>
          }
        />

        {expanded && (
          <div className="pb-2">
            {outcome.subs.length === 0 && (
              <p className="text-muted small ps-4 py-2 mb-0">No sub-outcomes yet.</p>
            )}
            {outcome.subs.map((s: AdminSubOutcome) => (
              <EditableRow
                key={s.subOutcomeId}
                indent
                code={s.code}
                label={s.label}
                sortOrder={s.sortOrder}
                active={s.active}
                usageCount={s.usageCount}
                onSave={async (v) => {
                  await send(`/api/admin/sub-outcomes/${s.subOutcomeId}`, 'PATCH', v);
                  refresh();
                }}
              />
            ))}

            <div className="ps-4 pt-2">
              {adding ? (
                <NewItemForm
                  title={`New sub-outcome under ${outcome.code}`}
                  defaultSort={nextSubSort}
                  onCancel={() => setAdding(false)}
                  onSave={async (v) => {
                    await send('/api/admin/sub-outcomes', 'POST', { ...v, outcomeId: outcome.outcomeId });
                    setAdding(false);
                    refresh();
                  }}
                />
              ) : (
                <button className="btn btn-outline-primary btn-sm" onClick={() => setAdding(true)}>
                  + Add sub-outcome
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The admin tab
// ---------------------------------------------------------------------------
export default function OutcomesAdminSection() {
  const refresh = useRefresh();
  const [adding, setAdding] = useState(false);

  const { data: outcomes, isLoading, isError } = useQuery<AdminOutcome[]>({
    queryKey: ['admin-outcomes'],
    queryFn: fetchTree,
  });

  const nextSort = outcomes?.length ? Math.max(...outcomes.map((o) => o.sortOrder)) + 1 : 0;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="fw-semibold mb-0">🎯 Outcomes</h5>
        {!adding && (
          <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>+ Add outcome</button>
        )}
      </div>
      <p className="text-muted small mb-3">
        Outcomes and their sub-outcomes appear as the cascading dropdowns on notes, links,
        meetings and documents. Untick <strong>Active</strong> to retire a value — it disappears
        from new selections but stays on records that already use it.
      </p>

      {adding && (
        <NewItemForm
          title="New outcome"
          defaultSort={nextSort}
          onCancel={() => setAdding(false)}
          onSave={async (v) => {
            await send('/api/admin/outcomes', 'POST', v);
            setAdding(false);
            refresh();
          }}
        />
      )}

      {isLoading && (
        <div className="text-center text-muted py-4">
          <span className="spinner-border spinner-border-sm me-2" />Loading…
        </div>
      )}
      {isError && (
        <div className="alert alert-warning py-2 small">Could not load outcomes — check you have the admin role.</div>
      )}
      {outcomes && outcomes.length === 0 && (
        <p className="text-muted small">No outcomes yet.</p>
      )}
      {outcomes?.map((o) => <OutcomeBlock key={o.outcomeId} outcome={o} />)}
    </div>
  );
}
