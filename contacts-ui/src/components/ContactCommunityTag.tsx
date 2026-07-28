'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserCommunities, getContactTags, postContactTag, deleteContactTag,
} from '@/libs/communitiesApi';
import type { Community, CommunityTag } from '@/types/community';

interface Props {
  contactId: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function TagBadge({
  tag, currentUsername, onRemove,
}: {
  tag: CommunityTag;
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
      className="badge bg-info text-dark rounded-pill d-inline-flex align-items-center gap-1"
      style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
      title={`Tagged by ${tag.taggedBy} on ${formatDate(tag.createdAt)}`}
    >
      🏘️ {tag.communityName}
      <span className="text-muted small ms-1" style={{ fontSize: '0.7rem' }}>
        by {tag.taggedBy}
      </span>
      {isOwner && (
        <button
          className="btn-close btn-close-sm ms-1"
          onClick={handleRemove}
          disabled={isRemoving}
          style={{ fontSize: '0.5rem' }}
          aria-label="Remove tag"
        />
      )}
    </span>
  );
}

export default function ContactCommunityTags({ contactId }: Props) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const username = session?.user?.username ?? '';

  // Fetch the user's communities — used to determine visibility and tag options
  const { data: userCommunities } = useQuery<Community[]>({
    queryKey: ['communities', username],
    queryFn: () => getUserCommunities(username),
    enabled: !!username,
  });

  // Fetch tags for this contact — all users see all tags
  const { data: tags, isLoading } = useQuery<CommunityTag[]>({
    queryKey: ['contact-tags', contactId],
    queryFn: () => getContactTags(contactId),
  });

  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [tagError, setTagError] = useState('');

  const addTagMutation = useMutation({
    mutationFn: postContactTag,
    onSuccess: () => {
      setSelectedCommunityId('');
      setTagError('');
      queryClient.invalidateQueries({ queryKey: ['contact-tags', contactId] });
    },
    onError: (err: Error) => setTagError(err.message),
  });

  async function handleRemoveTag(tagId: string) {
    await deleteContactTag(tagId, username);
    queryClient.invalidateQueries({ queryKey: ['contact-tags', contactId] });
  }

  function handleAddTag() {
    if (!selectedCommunityId) return;
    setTagError('');
    addTagMutation.mutate({ contactId, communityId: selectedCommunityId, taggedBy: username });
  }

  // Don't render anything if the user is not in any community
  const isInAnyCommunity = (userCommunities?.length ?? 0) > 0;
  const hasTags = (tags?.length ?? 0) > 0;

  // Hide the entire section if the user has no communities AND there are no tags to display
  if (!isInAnyCommunity && !hasTags) return null;

  return (
    <>
    <div className={`card border-1 mb-1 `}>
      <div className="card-header text-muted small">
        Community Tags
      </div>
      <div className="card-body py-2 px-3">
      {/* Existing tags */}
      {isLoading && (
        <p className="text-muted small">Loading tags…</p>
      )}

      {!isLoading && tags && tags.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <TagBadge
              key={tag.tagId}
              tag={tag}
              currentUsername={username}
              onRemove={handleRemoveTag}
            />
          ))}
        </div>
      )}

      {!isLoading && tags && tags.length === 0 && (
        <p className="text-muted small">No community tags yet for this contact.</p>
      )}

      {/* Add tag form — only shown if user is in at least one community */}
      {isInAnyCommunity && (
        <div className="card border-0 bg-light">
          <div className="card-body py-2 px-3">
            <div className="d-flex gap-2 align-items-center">
              <select
                className="form-select form-select-sm"
                value={selectedCommunityId}
                onChange={(e) => setSelectedCommunityId(e.target.value)}
                disabled={addTagMutation.isPending}
              >
                <option value="">Tag with a community…</option>
                {userCommunities!.map((c) => (
                  <option key={c.communityId} value={c.communityId}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAddTag}
                disabled={!selectedCommunityId || addTagMutation.isPending}
              >
                {addTagMutation.isPending ? '…' : 'Tag'}
              </button>
            </div>
            {tagError && (
              <div className="alert alert-danger py-1 small mt-2 mb-0">{tagError}</div>
            )}
          </div>
        </div>
      )}

      </div>

      


    </div>
    </>
  );
}
