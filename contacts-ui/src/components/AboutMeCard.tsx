'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAboutMe, saveAboutMe } from '@/libs/userProfileApi';

const MAX_LENGTH = 2000;

/** Optional "about me" text on the user's own profile. Drop into ProfilePanel. */
export default function AboutMeCard({ username }: { username: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const { data: aboutMe, isLoading } = useQuery<string>({
    queryKey: ['about-me', username],
    queryFn: () => getAboutMe(username),
    enabled: !!username,
  });

  useEffect(() => { if (aboutMe !== undefined && !editing) setValue(aboutMe); }, [aboutMe, editing]);

  async function save() {
    setBusy(true); setError('');
    try {
      await saveAboutMe(username, value.trim());
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['about-me', username] });
      queryClient.invalidateQueries({ queryKey: ['user-summary', username] });
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save'); }
    finally { setBusy(false); }
  }

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
        <h5 className="fw-semibold mb-0">🙋 About me</h5>
        {!editing && !isLoading && (
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditing(true)}>
            {aboutMe ? '✏️ Edit' : '+ Add'}
          </button>
        )}
      </div>
      <div className="card-body px-4 py-3">
        {isLoading && <span className="spinner-border spinner-border-sm text-muted" />}

        {!isLoading && !editing && (
          aboutMe
            ? <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{aboutMe}</p>
            : <p className="text-muted small mb-0">Nothing here yet. Tell colleagues a little about yourself — it shows when they click your name on a team page.</p>
        )}

        {editing && (
          <>
            <textarea className="form-control mb-1" rows={5} maxLength={MAX_LENGTH}
              placeholder="Your role, areas of interest, how best to reach you…"
              value={value} onChange={(e) => setValue(e.target.value)} disabled={busy} autoFocus />
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">{value.length}/{MAX_LENGTH}</small>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => { setEditing(false); setValue(aboutMe ?? ''); setError(''); }} disabled={busy}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
            {error && <div className="alert alert-danger py-1 small mt-2 mb-0">{error}</div>}
          </>
        )}
      </div>
    </div>
  );
}
