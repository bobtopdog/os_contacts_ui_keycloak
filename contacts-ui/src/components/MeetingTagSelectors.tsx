'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { getUserCommunities, getContactTags } from '@/libs/communitiesApi';
import { getUserMeetingGroups } from '@/libs/meetingGroupsApi';
import type { Community, CommunityTag } from '@/types/community';
import type { MeetingGroup } from '@/types/meetingGroup';

interface Props {
  contactId: string;                    // NEW — the contact the meeting is for
  selectedCommunityId: string;
  selectedGroupId: string;
  onCommunityChange: (communityId: string) => void;
  onGroupChange: (groupId: string) => void;
  disabled?: boolean;
}

/**
 * Optional community + meeting-group dropdowns for the create-meeting form.
 *
 * Communities list = communities already tagged against THIS CONTACT that the
 * current user is also a member of (the server rejects tags from non-members,
 * so showing others would only produce 403s).
 *
 * Groups list = meeting groups the user belongs to (unchanged).
 *
 * If neither list has entries, renders nothing.
 */
export default function MeetingTagSelectors({
  contactId,
  selectedCommunityId, selectedGroupId,
  onCommunityChange, onGroupChange,
  disabled = false,
}: Props) {
  const { data: session } = useSession();
  const username = session?.user?.username ?? '';

  // Communities the user belongs to
  const { data: userCommunities } = useQuery<Community[]>({
    queryKey: ['communities', username],
    queryFn: () => getUserCommunities(username),
    enabled: !!username,
    staleTime: 60_000,
  });

  // Communities already tagged against this contact
  const { data: contactTags } = useQuery<CommunityTag[]>({
    queryKey: ['contact-tags', contactId],
    queryFn: () => getContactTags(contactId),
    enabled: !!contactId,
  });

  const { data: groups } = useQuery<MeetingGroup[]>({
    queryKey: ['meeting-groups', username],
    queryFn: () => getUserMeetingGroups(username),
    enabled: !!username,
    staleTime: 60_000,
  });

  // Intersection: tagged against the contact AND user is a member.
  // Multiple tags of the same community are allowed, so dedupe by communityId.
  const memberCommunityIds = new Set(
    (userCommunities ?? []).map((c) => c.communityId)
  );
  const communityOptions = Array.from(
    new Map(
      (contactTags ?? [])
        .filter((t) => memberCommunityIds.has(t.communityId))
        .map((t) => [t.communityId, t.communityName])
    ),
    ([communityId, name]) => ({ communityId, name })
  ).sort((a, b) => a.name.localeCompare(b.name));

  const hasCommunities = communityOptions.length > 0;
  const hasGroups = (groups?.length ?? 0) > 0;

  if (!hasCommunities && !hasGroups) return null;

  return (
    <div className="row g-2 mb-3">
      {hasCommunities && (
        <div className="col-12 col-md-6">
          <label className="form-label small fw-medium mb-1">
            🏘️ Community <span className="text-muted">(optional)</span>
          </label>
          <select
            className="form-select form-select-sm"
            value={selectedCommunityId}
            onChange={(e) => onCommunityChange(e.target.value)}
            disabled={disabled}
          >
            <option value="">No community</option>
            {communityOptions.map((c) => (
              <option key={c.communityId} value={c.communityId}>
                {c.name}
              </option>
            ))}
          </select>
          <small className="text-muted" style={{ fontSize: '0.7rem' }}>
            Communities already tagged on this contact.
          </small>
        </div>
      )}

      {hasGroups && (
        <div className="col-12 col-md-6">
          <label className="form-label small fw-medium mb-1">
            👥 Mailing group <span className="text-muted">(optional)</span>
          </label>
          <select
            className="form-select form-select-sm"
            value={selectedGroupId}
            onChange={(e) => onGroupChange(e.target.value)}
            disabled={disabled}
          >
            <option value="">No group</option>
            {groups!.map((g) => (
              <option key={g.groupId} value={g.groupId}>
                {g.name}
              </option>
            ))}
          </select>
          <small className="text-muted" style={{ fontSize: '0.7rem' }}>
            Group members will be emailed about this meeting.
          </small>
        </div>
      )}
    </div>
  );
}