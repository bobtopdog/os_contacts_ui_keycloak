'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMinisterMeetings,
  postMinisterMeeting,
  patchMinisterMeeting,
  deleteMinisterMeeting,
} from '@/libs/ministers/api';
import type { MinisterMeeting } from '@/types/minister';

interface Props {
  ministerId: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// MeetingCard — view, inline edit, delete
// ---------------------------------------------------------------------------
function MeetingCard({
  meeting, currentUsername, ministerId, onRefresh,
}: {
  meeting: MinisterMeeting;
  currentUsername: string;
  ministerId: number;
  onRefresh: () => void;
}) {
  const isOwner = meeting.username === currentUsername;
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState(meeting.meetingDate);
  const [editTitle, setEditTitle] = useState(meeting.title);
  const [editComments, setEditComments] = useState(meeting.comments);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleSaveEdit() {
    if (!editTitle.trim() || !editDate) return;
    setIsSaving(true);
    setError('');
    try {
      await patchMinisterMeeting(meeting.meetingId, {
        username: currentUsername,
        meetingDate: editDate,
        title: editTitle.trim(),
        comments: editComments.trim(),
      });
      setIsEditing(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditDate(meeting.meetingDate);
    setEditTitle(meeting.title);
    setEditComments(meeting.comments);
    setIsEditing(false);
    setError('');
  }

  async function handleDelete() {
    setIsDeleting(true);
    setError('');
    try {
      await deleteMinisterMeeting(meeting.meetingId, currentUsername);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className={`card border-0 mb-3 ${isOwner ? 'bg-primary bg-opacity-10' : 'bg-light'}`}>
      <div className="card-body py-2 px-3">

        {/* View mode */}
        {!isEditing && !confirmDelete && (
          <>
            <div className="d-flex justify-content-between align-items-start mb-1">
              <div>
                <span className="fw-semibold">{meeting.title}</span>
                <div>
                  <small className="text-muted">
                    📅 {formatDate(meeting.meetingDate)}
                    {' '}&middot;{' '}👤 <strong>{meeting.username}</strong>
                    {isOwner && (
                      <span className="badge bg-primary ms-2 rounded-pill">you</span>
                    )}
                  </small>
                </div>
              </div>
              {isOwner && (
                <div className="d-flex gap-2 flex-shrink-0">
                  <button
                    className="btn btn-outline-secondary btn-sm py-0"
                    onClick={() => setIsEditing(true)}
                    title="Edit"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm py-0"
                    onClick={() => setConfirmDelete(true)}
                    title="Delete"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
            {meeting.comments && (
              <p className="mb-0 small mt-2" style={{ whiteSpace: 'pre-wrap' }}>
                {meeting.comments}
              </p>
            )}
          </>
        )}

        {/* Edit mode */}
        {isEditing && (
          <>
            <div className="mb-2">
              <label className="form-label small fw-medium mb-1">Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="mb-2">
              <label className="form-label small fw-medium mb-1">Title</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="mb-2">
              <label className="form-label small fw-medium mb-1">Comments</label>
              <textarea
                className="form-control form-control-sm"
                rows={3}
                value={editComments}
                onChange={(e) => setEditComments(e.target.value)}
                disabled={isSaving}
              />
            </div>
            {error && (
              <div className="alert alert-danger py-1 small mb-2">{error}</div>
            )}
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveEdit}
                disabled={!editTitle.trim() || !editDate || isSaving}
              >
                {isSaving
                  ? <><span className="spinner-border spinner-border-sm me-1" />Saving…</>
                  : 'Save changes'}
              </button>
            </div>
          </>
        )}

        {/* Delete confirmation */}
        {confirmDelete && (
          <>
            <p className="mb-2 text-danger fw-medium small">
              Delete this meeting record? This cannot be undone.
            </p>
            {error && (
              <div className="alert alert-danger py-1 small mb-2">{error}</div>
            )}
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
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
// Add meeting form (collapsible)
// ---------------------------------------------------------------------------
function AddMeetingForm({
  ministerId, username, onSaved,
}: {
  ministerId: number;
  username: string;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [comments, setComments] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!title.trim() || !date) return;
    setIsSaving(true);
    setError('');
    try {
      await postMinisterMeeting({
        ministerId, username,
        meetingDate: date,
        title: title.trim(),
        comments: comments.trim(),
      });
      setTitle('');
      setComments('');
      setDate(new Date().toISOString().split('T')[0]);
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  if (!open) {
    return (
      <button className="btn btn-primary btn-sm mb-4" onClick={() => setOpen(true)}>
        + Record a meeting
      </button>
    );
  }

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <h6 className="fw-semibold mb-3">New meeting record</h6>

        <div className="mb-2">
          <label className="form-label small fw-medium mb-1">Date</label>
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <div className="mb-3">
          <label className="form-label small fw-medium mb-1">Comments</label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Meeting notes…"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            disabled={isSaving}
          />
        </div>

        {error && <div className="alert alert-danger py-2 small mb-2">{error}</div>}

        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">Saving as <strong>{username}</strong></small>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => { setOpen(false); setError(''); }}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm px-4"
              onClick={handleSave}
              disabled={!title.trim() || !date || isSaving}
            >
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
// Main MinisterMeetings component
// ---------------------------------------------------------------------------
export default function MinisterMeetings({ ministerId }: Props) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const username = session?.user?.username ?? '';

  const { data: meetings, isLoading, isError } = useQuery<MinisterMeeting[]>({
    queryKey: ['minister-meetings', ministerId],
    queryFn: () => getMinisterMeetings(ministerId),
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['minister-meetings', ministerId] });
  }

  return (
    <div className="mt-4">
      

      {status === 'authenticated' && (
        <AddMeetingForm ministerId={ministerId} username={username} onSaved={refresh} />
      )}

      {status === 'unauthenticated' && (
        <div className="alert alert-info py-2 small mb-4">
          Please sign in to record meetings.
        </div>
      )}

      {isLoading && (
        <div className="text-center text-muted py-3">
          <span className="spinner-border spinner-border-sm me-2" />Loading meetings…
        </div>
      )}

      {isError && (
        <div className="alert alert-warning py-2 small">
          Could not load meetings. Please try refreshing.
        </div>
      )}

      {meetings && meetings.length === 0 && (
        <p className="text-muted small">No meetings recorded yet.</p>
      )}

      {meetings && meetings.length > 0 && meetings.map((meeting) => (
        <MeetingCard
          key={meeting.meetingId}
          meeting={meeting}
          currentUsername={username}
          ministerId={ministerId}
          onRefresh={refresh}
        />
      ))}
    </div>
  );
}
