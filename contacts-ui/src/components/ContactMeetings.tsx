'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMeetings, postMeeting, patchMeeting,
  deleteMeeting, postMeetingLink, deleteMeetingLink,
} from '@/libs/api';
import type { ContactMeeting, MeetingLink } from '@/types/contact';
import MeetingGroupTagger from '@/components/MeetingGroupTagger';
import MeetingTagSelectors from '@/components/MeetingTagSelectors';
import { tagMeetingWithCommunity } from '@/libs/communitiesApi';
//import { tagMeetingWithGroup } from '@/libs/meetingGroupsApi';
import MeetingCommunityTags from '@/components/MeetingCommunityTags';
import OutcomeSelector from '@/components/OutcomeSelector';
import OutcomeBadge from '@/components/OutcomeBadge';
import { MeetingAssessmentEditor, MeetingAssessmentSummary } from '@/components/MeetingAssessment';
import { EMPTY_ASSESSMENT, type MeetingAssessment } from '@/types/meetingAssessment';

interface Props { contactId: string; }

const BASE_URL = process.env.NEXT_PUBLIC_OPENTEXT_BASE_URL ?? '';

const SCORE_LABELS = ['Relevance', 'Actionability', 'Risk', 'Meeting Score'] as const;

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// StarRating — interactive or read-only
// ---------------------------------------------------------------------------
function StarRating({
  value, onChange, readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <span className="d-inline-flex gap-1" style={{ fontSize: '1.25rem' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            cursor: readOnly ? 'default' : 'pointer',
            color: star <= display ? '#f5a623' : '#ccc',
            transition: 'color 0.1s',
          }}
          onClick={() => !readOnly && onChange?.(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          role={readOnly ? undefined : 'button'}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </span>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Scores display (read-only grid)
// ---------------------------------------------------------------------------
function ScoresGrid({ scores }: { scores: [number, number, number, number] }) {
  return (
    <div className="row g-2 mt-1">
      {SCORE_LABELS.map((label, i) => (
        <div key={label} className="col-6 col-md-3">
          <div className="bg-white rounded p-2 text-center border">
            <div className="text-muted small mb-1">{label}</div>
            <StarRating value={scores[i]} readOnly />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScoresEditor (interactive)
// ---------------------------------------------------------------------------
function ScoresEditor({
  scores, onChange,
}: {
  scores: [number, number, number, number];
  onChange: (scores: [number, number, number, number]) => void;
}) {
  return (
    <div className="row g-2 mt-1">
      {SCORE_LABELS.map((label, i) => (
        <div key={label} className="col-6 col-md-3">
          <div className="bg-white rounded p-2 text-center border">
            <div className="text-muted small mb-1">{label}</div>
            <StarRating
              value={scores[i]}
              onChange={(v) => {
                const next = [...scores] as [number, number, number, number];
                next[i] = v;
                onChange(next);
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MeetingLinkRow — single document link with delete button
// ---------------------------------------------------------------------------
function MeetingLinkRow({
  link, isOwner, onDelete,
}: {
  link: MeetingLink;
  isOwner: boolean;
  onDelete: (meetingLinkId: string) => void;
}) {
  const fullUrl = `${BASE_URL}${link.reference}`;
  return (
    <div className="d-flex align-items-center justify-content-between gap-2 py-1 border-bottom">
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary text-decoration-none small"
      >
        🔗 {link.reference} ↗
      </a>
      {isOwner && (
        <button
          className="btn btn-outline-danger btn-sm py-0 px-1"
          onClick={() => onDelete(link.meetingLinkId)}
          title="Remove link"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MeetingForm — shared between add and edit modes
// ---------------------------------------------------------------------------
interface MeetingFormState {
  meetingDate: string;
  title: string;
  notes: string;
  scores: [number, number, number, number];
  outcomeId: number | null;
  subOutcomeId: number | null;
  assessment: MeetingAssessment;
}

function emptyForm(): MeetingFormState {
  return {
    meetingDate: new Date().toLocaleDateString('en-CA'),
    title: '',
    notes: '',
    scores: [0, 0, 0, 0],
    outcomeId: null,
    subOutcomeId: null,
    assessment: EMPTY_ASSESSMENT,
  };
}

function formFromMeeting(m: ContactMeeting): MeetingFormState {
  return {
    meetingDate: m.meetingDate,
    title: m.title,
    notes: m.notes,
    scores: [m.score1, m.score2, m.score3, m.score4],
    outcomeId: m.outcomeId,
    subOutcomeId: m.subOutcomeId,
    assessment: m.assessment ?? EMPTY_ASSESSMENT,
  };
}

// ---------------------------------------------------------------------------
// MeetingCard — view, inline edit, delete confirmation, link management
// ---------------------------------------------------------------------------
function MeetingCard({
  meeting, currentUsername, contactId, onRefresh,
}: {
  meeting: ContactMeeting;
  currentUsername: string;
  contactId: string;
  onRefresh: () => void;
}) {
  const isOwner = meeting.username === currentUsername;
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<MeetingFormState>(formFromMeeting(meeting));
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newRef, setNewRef] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [error, setError] = useState('');

  async function handleSaveEdit() {
    setIsSaving(true);
    setError('');
    try {
      await patchMeeting(meeting.meetingId, {
        username: currentUsername,
        meetingDate: form.meetingDate,
        title: form.title,
        notes: form.notes,
        score1: form.scores[0],
        score2: form.scores[1],
        score3: form.scores[2],
        score4: form.scores[3],
        outcomeId: form.outcomeId,
        subOutcomeId: form.subOutcomeId,
        assessment: form.assessment,
      });
      setIsEditing(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update meeting');
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    setForm(formFromMeeting(meeting));
    setIsEditing(false);
    setError('');
  }

  async function handleDelete() {
    setIsDeleting(true);
    setError('');
    try {
      await deleteMeeting(meeting.meetingId, currentUsername);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete meeting');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleAddLink() {
    if (!newRef.trim()) return;
    setIsAddingLink(true);
    try {
      await postMeetingLink(meeting.meetingId, newRef.trim());
      setNewRef('');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add link');
    } finally {
      setIsAddingLink(false);
    }
  }

  async function handleDeleteLink(meetingLinkId: string) {
    try {
      await deleteMeetingLink(meeting.meetingId, meetingLinkId);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove link');
    }
  }

  return (
    <div className={`card border-0 mb-4 ${isOwner ? 'bg-primary bg-opacity-10' : 'bg-light'}`}>
      <div className="card-body px-3 py-3">

        {/* ---- View mode ---- */}
        {!isEditing && !confirmDelete && (
          <>
            {/* Header row */}
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span className="fw-semibold">📅 {formatDate(meeting.meetingDate)}</span>
                <small className="text-muted ms-2">
                  👤 <strong>{meeting.username}</strong>
                  {isOwner && <span className="badge bg-primary ms-1 rounded-pill">you</span>}
                </small>
              </div>
              {isOwner && (
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary btn-sm py-0"
                    onClick={() => { setForm(formFromMeeting(meeting)); setIsEditing(true); }}
                  >✏️ Edit</button>
                  <button
                    className="btn btn-outline-danger btn-sm py-0"
                    onClick={() => setConfirmDelete(true)}
                  >🗑️ Delete</button>
                </div>
              )}
            </div>
            {meeting.title && <span className="fw-semibold">{meeting.title}</span>}

            {/* Notes */}
            {meeting.notes && (
              <p className="mb-2 small" style={{ whiteSpace: 'pre-wrap' }}>{meeting.notes}</p>
            )}
            <p><OutcomeBadge outcomeId={meeting.outcomeId} subOutcomeId={meeting.subOutcomeId} /></p>

            {/* Scores 
            <ScoresGrid scores={[meeting.score1, meeting.score2, meeting.score3, meeting.score4]} />
            */}
            <MeetingAssessmentSummary value={meeting.assessment ?? EMPTY_ASSESSMENT} />

            {/* Document links */}
            <div className="mt-3">
              <div className="text-muted small fw-medium mb-1">📄 Documents</div>
              {meeting.links.length === 0 && (
                <p className="text-muted small mb-1">No documents linked.</p>
              )}
              {meeting.links.map((link) => (
                <MeetingLinkRow
                  key={link.meetingLinkId}
                  link={link}
                  isOwner={isOwner}
                  onDelete={handleDeleteLink}
                />
              ))}

              {/* Add link inline */}
              {isOwner && (
                <div className="d-flex gap-2 mt-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Add document reference…"
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    disabled={isAddingLink}
                  />
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={handleAddLink}
                    disabled={!newRef.trim() || isAddingLink}
                  >
                    {isAddingLink ? '…' : 'Add'}
                  </button>
                </div>
              )}
            </div>
            <div className="mt-3">
              <MeetingGroupTagger meetingId={meeting.meetingId} />


            </div>
            <div className="mt-3">
              <MeetingCommunityTags meetingId={meeting.meetingId} />
            </div>






            {error && <div className="alert alert-danger py-1 small mt-2">{error}</div>}
          </>
        )}

        {/* ---- Edit mode ---- */}
        {isEditing && (
          <>
            <div className="mb-2">
              <label className="form-label small fw-medium mb-1">Meeting date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={form.meetingDate}
                onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
                disabled={isSaving}
              />
            </div>
            <div className="mb-2">
  <label className="form-label small fw-medium mb-1">
    Title <span className="text-danger">*</span>
  </label>
  <input
    type="text"
    className="form-control"
    placeholder="Meeting title…"
    value={form.title}
    onChange={(e) => setForm({ ...form, title: e.target.value })}
    disabled={isSaving}
  />
</div>
            <div className="mb-2">
              <label className="form-label small fw-medium mb-1">Notes</label>
              <textarea
                className="form-control form-control-sm"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                disabled={isSaving}
              />
            </div>
            <div className="mb-2">
              <OutcomeSelector
                value={{ outcomeId: form.outcomeId, subOutcomeId: form.subOutcomeId }}
                onChange={(o) => setForm({ ...form, ...o })}
                disabled={isSaving}
              />
            </div>
            {/* ---- Edit mode 
            <div className="mb-3">
              <label className="form-label small fw-medium mb-1">Scores</label>
              <ScoresEditor
                scores={form.scores}
                onChange={(scores) => setForm({ ...form, scores })}
              />
            </div>
            ---- */}

            <div className="mb-3">
              <label className="form-label small fw-medium mb-1">Meeting assessment</label>
              <MeetingAssessmentEditor
                value={form.assessment}
                onChange={(assessment) => setForm({ ...form, assessment })}
                disabled={isSaving}
              />
            </div>
            {error && <div className="alert alert-danger py-1 small mb-2">{error}</div>}
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={handleCancelEdit} disabled={isSaving}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving
                  ? <><span className="spinner-border spinner-border-sm me-1" />Saving…</>
                  : 'Save changes'}
              </button>
            </div>
          </>
        )}

        {/* ---- Delete confirmation ---- */}
        {confirmDelete && (
          <>
            <p className="mb-2 text-danger fw-medium">
              Delete this meeting record? All linked documents will also be removed. This cannot be undone.
            </p>
            {error && <div className="alert alert-danger py-1 small mb-2">{error}</div>}
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setConfirmDelete(false)} disabled={isDeleting}>
                Cancel
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting
                  ? <><span className="spinner-border spinner-border-sm me-1" />Deleting…</>
                  : 'Yes, delete'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add meeting form
// ---------------------------------------------------------------------------
function AddMeetingForm({
  contactId, username, onSaved,
}: {
  contactId: string;
  username: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<MeetingFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [communityId, setCommunityId] = useState('');

  async function handleSave() {
    setIsSaving(true);
    setError('');
    try {
      const meeting = await postMeeting({
        contactId, username,
        meetingDate: form.meetingDate,
        title: form.title,
        notes: form.notes,
        score1: form.scores[0], score2: form.scores[1],
        score3: form.scores[2], score4: form.scores[3],
        outcomeId: form.outcomeId, subOutcomeId: form.subOutcomeId,
        assessment: form.assessment,
      });
      // Optional tags — failures shouldn't block the meeting save
      const tagJobs: Promise<unknown>[] = [];
      if (communityId) {
        tagJobs.push(tagMeetingWithCommunity({
          meetingId: meeting.meetingId, communityId, taggedBy: username,
        }));
      }
      await Promise.allSettled(tagJobs);

      setCommunityId('');

      setForm(emptyForm());
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save meeting');
    } finally {
      setIsSaving(false);
    }
  }


  if (!open) {
    return (
      <button className="btn btn-primary btn-sm mb-4" onClick={() => setOpen(true)}>
        + Add meeting record
      </button>
    );
  }

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <h6 className="fw-semibold mb-3">New meeting record</h6>

        <div className="mb-2">
          <label className="form-label small fw-medium mb-1">Meeting date</label>
          <input
            type="date"
            className="form-control"
            value={form.meetingDate}
            onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
            disabled={isSaving}
          />
        </div>

        <div className="mb-2">
  <label className="form-label small fw-medium mb-1">
    Title <span className="text-danger">*</span>
  </label>
  <input
    type="text"
    className="form-control"
    placeholder="Meeting title…"
    value={form.title}
    
    onChange={(e) => setForm({ ...form, title: e.target.value })}
    disabled={isSaving}
  />
</div>

        <div className="mb-2">
          <label className="form-label small fw-medium mb-1">Notes</label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Meeting notes…"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            disabled={isSaving}
          />
        </div>
        <div className="mb-2">
          <OutcomeSelector
            value={{ outcomeId: form.outcomeId, subOutcomeId: form.subOutcomeId }}
            onChange={(o) => setForm({ ...form, ...o })}
            disabled={isSaving}
          />
        </div>

        <MeetingTagSelectors
          contactId={contactId}
          selectedCommunityId={communityId}
          //selectedGroupId={groupId}
          onCommunityChange={setCommunityId}
          //onGroupChange={setGroupId}
          disabled={isSaving}
        />
{/* ----  
        <div className="mb-3">
          <label className="form-label small fw-medium mb-1">Scores</label>
          <ScoresEditor
            scores={form.scores}
            onChange={(scores) => setForm({ ...form, scores })}
          />
        </div>
        ---- */}

        <div className="mb-3">
          <label className="form-label small fw-medium mb-1">Meeting assessment</label>
          <MeetingAssessmentEditor
            value={form.assessment}
            onChange={(assessment) => setForm({ ...form, assessment })}
            disabled={isSaving}
          />
        </div>

        {error && <div className="alert alert-danger py-2 small mb-2">{error}</div>}

        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">Saving as <strong>{username}</strong></small>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => { setOpen(false); setError(''); }} disabled={isSaving}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm px-4" onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? <><span className="spinner-border spinner-border-sm me-1" />Saving…</>
                : 'Save meeting'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ContactMeetings component
// ---------------------------------------------------------------------------
export default function ContactMeetings({ contactId }: Props) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const username = session?.user?.username ?? '';

  const { data: meetings, isLoading, isError } = useQuery<ContactMeeting[]>({
    queryKey: ['meetings', contactId],
    queryFn: () => getMeetings(contactId),
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['meetings', contactId] });
    queryClient.invalidateQueries({ queryKey: ['meeting-community-tags'] });
    queryClient.invalidateQueries({ queryKey: ['meeting-group-tags'] });
  }

  return (
    <div className="mt-1">


      {status === 'authenticated' && (
        <AddMeetingForm contactId={contactId} username={username} onSaved={refresh} />
      )}

      {status === 'unauthenticated' && (
        <div className="alert alert-info py-2 small mb-4">Please sign in to add meeting records.</div>
      )}

      {isLoading && (
        <div className="text-center text-muted py-3">
          <span className="spinner-border spinner-border-sm me-2" />Loading meeting records…
        </div>
      )}

      {isError && (
        <div className="alert alert-warning py-2 small">Could not load meeting records. Please try refreshing.</div>
      )}

      {meetings && meetings.length === 0 && (
        <p className="text-muted small">No meeting records yet for this contact.</p>
      )}

      {meetings && meetings.length > 0 && meetings.map((meeting) => (
        <MeetingCard
          key={meeting.meetingId}
          meeting={meeting}
          currentUsername={username}
          contactId={contactId}
          onRefresh={refresh}
        />
      ))}
    </div>
  );
}
