'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserMeetingGroups,
  getMeetingGroupTags,
  tagMeetingWithGroup,
  removeMeetingGroupTag,
} from '@/libs/meetingGroupsApi';
import type { MeetingGroup, MeetingGroupTag } from '@/types/meetingGroup';

interface Props {
  meetingId: string;
}

function TagBadge({
  tag, currentUsername, onRemove,
}: {
  tag: MeetingGroupTag;
  currentUsername: string;
  onRemove: (tagId: string) => Promise<void>;
}) {
  const isOwner = tag.taggedBy === currentUsername;
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleRemove() {
    setIsRemoving(true);
    try {
      await onRemove(tag.tagId);
    } catch {
      setIsRemoving(false);
    }
  }

  return (
    <span
      className="badge bg-secondary rounded-pill d-inline-flex align-items-center gap-1"
      style={{ fontSize: '0.75rem', padding: '0.35rem 0.55rem' }}
      title={`Tagged by ${tag.taggedBy}`}
    >
      👥 {tag.groupName}
      {isOwner && (
        <button
          className="btn-close btn-close-white ms-1"
          onClick={handleRemove}
          disabled={isRemoving}
          style={{ fontSize: '0.45rem' }}
          aria-label="Remove tag"
        />
      )}
    </span>
  );
}

/**
 * Requirement 5 — tag a contact meeting with one of the user's meeting
 * groups. All group members receive an email notification (handled by the
 * API route). Embed inside each MeetingCard in ContactMeetings.tsx:
 *
 *   <MeetingGroupTagger meetingId={meeting.meetingId} />
 */
export default function MeetingGroupTagger({ meetingId }: Props) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const username = session?.user?.username ?? '';

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [error, setError] = useState('');

  // User's groups (shared query key with the panel — deduped)
  const { data: myGroups } = useQuery<MeetingGroup[]>({
    queryKey: ['meeting-groups', username],
    queryFn: () => getUserMeetingGroups(username),
    enabled: !!username,
  });

  // Existing tags on this meeting
  const { data: tags } = useQuery<MeetingGroupTag[]>({
    queryKey: ['meeting-group-tags', meetingId],
    queryFn: () => getMeetingGroupTags(meetingId),
  });

  const tagMutation = useMutation({
    mutationFn: tagMeetingWithGroup,
    onSuccess: () => {
      setSelectedGroupId('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['meeting-group-tags', meetingId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  async function handleRemoveTag(tagId: string) {
    await removeMeetingGroupTag(meetingId, tagId, username);
    queryClient.invalidateQueries({ queryKey: ['meeting-group-tags', meetingId] });
  }

  function handleTag() {
    if (!selectedGroupId) return;
    setError('');
    tagMutation.mutate({ meetingId, groupId: selectedGroupId, taggedBy: username });
  }

  const isInAnyGroup = (myGroups?.length ?? 0) > 0;
  const hasTags = (tags?.length ?? 0) > 0;

  // Nothing to show if the user has no groups and there are no tags
  if (!isInAnyGroup && !hasTags) return null;

  // Groups not already tagged on this meeting
  const availableGroups = myGroups?.filter(
    (g) => !tags?.some((t) => t.groupId === g.groupId)
  ) ?? [];

  return (
    <div className="mt-2 pt-2 border-top">
      <div className="text-muted small fw-medium mb-1">👥 Meeting Group tags</div>

      {/* Existing tags */}
      {hasTags && (
        <div className="d-flex flex-wrap gap-1 mb-2">
          {tags!.map((tag) => (
            <TagBadge
              key={tag.tagId}
              tag={tag}
              currentUsername={username}
              onRemove={handleRemoveTag}
            />
          ))}
        </div>
      )}

      {/* Tag form — only if the user is in a group not yet tagged */}
      {isInAnyGroup && availableGroups.length > 0 && (
        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            disabled={tagMutation.isPending}
          >
            <option value="">Tag with a group…</option>
            {availableGroups.map((g) => (
              <option key={g.groupId} value={g.groupId}>{g.name}</option>
            ))}
          </select>
          <button
            className="btn btn-outline-primary btn-sm flex-shrink-0"
            onClick={handleTag}
            disabled={!selectedGroupId || tagMutation.isPending}
            title="Tag — all group members will be emailed"
          >
            {tagMutation.isPending ? '…' : '🏷️ Tag'}
          </button>
        </div>
      )}

      {isInAnyGroup && availableGroups.length > 0 && (
        <small className="text-muted" style={{ fontSize: '0.68rem' }}>
          Tagging emails all members of the selected group.
        </small>
      )}

      {error && (
        <div className="alert alert-danger py-1 small mt-2 mb-0">{error}</div>
      )}
    </div>
  );
}
