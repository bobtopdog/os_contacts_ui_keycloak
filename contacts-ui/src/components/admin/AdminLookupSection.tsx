'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminLookupItem, LookupKind } from '@/types/adminLookup';

const NOTES_API = process.env.NEXT_PUBLIC_NOTES_API_URL ?? 'http://localhost:3000';

async function fetchAll(kind: LookupKind): Promise<AdminLookupItem[]> {
  const res = await fetch(`${NOTES_API}/api/admin/${kind}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${kind}: ${res.status}`);
  return (await res.json()).data;
}

async function saveItem(
  kind: LookupKind,
  item: { id?: string; name: string; description: string; active: boolean; intranetUrl?: string }
): Promise<void> {
  const isEdit = !!item.id;
  const res = await fetch(
    isEdit ? `${NOTES_API}/api/admin/${kind}/${item.id}` : `${NOTES_API}/api/admin/${kind}`,
    {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Save failed: ${res.status}`);
  }
}

interface Props {
  kind: LookupKind;
  title: string;
  nameLabel: string;          // "Tag", "Area", "Team name"
  showUrl?: boolean;          // teams only
}

/**
 * Generic list/add/edit section for a lookup table. No delete — rows are
 * deactivated via the Active checkbox and disappear from user dropdowns.
 */
export default function AdminLookupSection({ kind, title, nameLabel, showUrl = false }: Props) {
  const queryClient = useQueryClient();
  const { data: items, isLoading, isError } = useQuery<AdminLookupItem[]>({
    queryKey: ['admin', kind],
    queryFn: () => fetchAll(kind),
  });

  // null = not editing; '' = adding new; uuid = editing that row
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [intranetUrl, setIntranetUrl] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function startAdd() {
    setEditingId('');
    setName(''); setDescription(''); setActive(true); setIntranetUrl('');
    setError('');
  }

  function startEdit(item: AdminLookupItem) {
    setEditingId(item.id);
    setName(item.name);
    setDescription(item.description);
    setActive(item.active);
    setIntranetUrl(item.intranetUrl ?? '');
    setError('');
  }

  function cancel() {
    setEditingId(null);
    setError('');
  }

  async function handleSave() {
    if (!name.trim()) return;
    setIsSaving(true);
    setError('');
    try {
      await saveItem(kind, {
        ...(editingId ? { id: editingId } : {}),
        name: name.trim(),
        description: description.trim(),
        active,
        ...(showUrl ? { intranetUrl: intranetUrl.trim() } : {}),
      });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', kind] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }

  const isFormOpen = editingId !== null;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-semibold mb-0">{title}</h5>
        {!isFormOpen && (
          <button className="btn btn-primary btn-sm" onClick={startAdd}>
            + Add {nameLabel.toLowerCase()}
          </button>
        )}
      </div>

      {/* Add / edit form */}
      {isFormOpen && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <h6 className="fw-semibold mb-2">
              {editingId === '' ? `New ${nameLabel.toLowerCase()}` : `Edit ${nameLabel.toLowerCase()}`}
            </h6>
            <div className="row g-2">
              <div className={showUrl ? 'col-12 col-md-4' : 'col-12 col-md-5'}>
                <label className="form-label small mb-1">{nameLabel} <span className="text-danger">*</span></label>
                <input type="text" className="form-control form-control-sm"
                  value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving} />
              </div>
              <div className={showUrl ? 'col-12 col-md-4' : 'col-12 col-md-7'}>
                <label className="form-label small mb-1">Description</label>
                <input type="text" className="form-control form-control-sm"
                  value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSaving} />
              </div>
              {showUrl && (
                <div className="col-12 col-md-4">
                  <label className="form-label small mb-1">Intranet URL</label>
                  <input type="text" className="form-control form-control-sm"
                    value={intranetUrl} onChange={(e) => setIntranetUrl(e.target.value)} disabled={isSaving} />
                </div>
              )}
            </div>
            <div className="form-check mt-2">
              <input className="form-check-input" type="checkbox" id={`${kind}-active`}
                checked={active} onChange={(e) => setActive(e.target.checked)} disabled={isSaving} />
              <label className="form-check-label small" htmlFor={`${kind}-active`}>
                Active (shown in dropdown lists)
              </label>
            </div>
            {error && <div className="alert alert-danger py-1 small mt-2 mb-0">{error}</div>}
            <div className="d-flex justify-content-end gap-2 mt-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={cancel} disabled={isSaving}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}
                disabled={!name.trim() || isSaving}>
                {isSaving
                  ? <><span className="spinner-border spinner-border-sm me-1" />Saving…</>
                  : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listing */}
      {isLoading && (
        <div className="text-center text-muted py-4">
          <span className="spinner-border spinner-border-sm me-2" />Loading…
        </div>
      )}
      {isError && (
        <div className="alert alert-warning py-2 small">
          Could not load {kind} — check you have the admin role.
        </div>
      )}
      {items && items.length === 0 && (
        <p className="text-muted small">No rows yet.</p>
      )}
      {items && items.length > 0 && (
        <div className="table-responsive">
          <table className="table table-sm table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>{nameLabel}</th>
                <th>Description</th>
                {showUrl && <th>Intranet URL</th>}
                <th className="text-center">Active</th>
                <th className="text-end">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={item.active ? '' : 'text-muted'}>
                  <td className="fw-medium small">{item.name}</td>
                  <td className="small">{item.description || <span className="text-muted">—</span>}</td>
                  {showUrl && (
                    <td className="small">{item.intranetUrl || <span className="text-muted">—</span>}</td>
                  )}
                  <td className="text-center">
                    {item.active
                      ? <span className="badge bg-success rounded-pill">active</span>
                      : <span className="badge bg-secondary rounded-pill">inactive</span>}
                  </td>
                  <td className="text-end">
                    <button className="btn btn-outline-secondary btn-sm py-0"
                      onClick={() => startEdit(item)} disabled={isFormOpen && editingId !== item.id}>
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
