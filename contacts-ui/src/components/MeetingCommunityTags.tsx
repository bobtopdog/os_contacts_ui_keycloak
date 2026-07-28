'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMeetingCommunityTags, removeMeetingCommunityTag,
} from '@/libs/communitiesApi';
import type { MeetingCommunityTag } from '@/types/community';

/**
 * Shows community tag badges on a meeting card.
 * Only the user who tagged can remove their tag.
 * Renders nothing if the meeting has no community tags.
 */
export default function MeetingCommunityTags({ meetingId }: { meetingId: string }) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const username = session?.user?.username ?? '';
  const [removingId, setRemovingId] = useState('');

  const { data: tags } = useQuery<MeetingCommunityTag[]>({
    queryKey: ['meeting-community-tags', meetingId],
    queryFn: () => getMeetingCommunityTags(meetingId),
  });

  async function handleRemove(tagId: string) {
    setRemovingId(tagId);
    try {
      await removeMeetingCommunityTag(meetingId, tagId, username);
      queryClient.invalidateQueries({ queryKey: ['meeting-community-tags', meetingId] });
    } catch {
      // silently reset — badge stays if removal fails
    } finally {
      setRemovingId('');
    }
  }

  if (!tags || tags.length === 0) return null;

  return (
    <div className="d-flex flex-wrap gap-2 mt-2">
      {tags.map((tag) => (
        <span
          key={tag.tagId}
          className="badge bg-success bg-opacity-75 rounded-pill d-inline-flex align-items-center gap-1"
          style={{ fontSize: '0.75rem' }}
          title={`Tagged by ${tag.taggedBy}`}
        >
          🏘️ {tag.communityName}
          {tag.taggedBy === username && (
            <button
              className="btn-close btn-close-white ms-1"
              style={{ fontSize: '0.5rem' }}
              onClick={() => handleRemove(tag.tagId)}
              disabled={removingId === tag.tagId}
              aria-label="Remove community tag"
            />
          )}
        </span>
      ))}
    </div>
  );
}
