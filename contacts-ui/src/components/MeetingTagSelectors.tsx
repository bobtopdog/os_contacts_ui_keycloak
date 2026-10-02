'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { getUserCommunities, getContactTags } from '@/libs/communitiesApi';
import type { Community, CommunityTag } from '@/types/community';

interface Props {
  contactId: string;
  selectedCommunityId: string;
  onCommunityChange: (communityId: string) => void;
  disabled?: boolean;
}

/**
 * Single optional community dropdown for the create-meeting form.
 * Options = communities already tagged on this contact that the user belongs to.
 * Tagging with a community automatically emails its linked email group, so
 * there's no longer a separate "mailing group" choice.
 */
export default function MeetingTagSelectors({ contactId, selectedCommunityId, onCommunityChange, disabled = false }: Props) {
  const { data: session } = useSession();
  const username = session?.user?.username ?? '';

  const { data: userCommunities } = useQuery<Community[]>({
    queryKey: ['communities', username],
    queryFn: () => getUserCommunities(username),
    enabled: !!username, staleTime: 60_000,
  });
  const { data: contactTags } = useQuery<CommunityTag[]>({
    queryKey: ['contact-tags', contactId],
    queryFn: () => getContactTags(contactId),
    enabled: !!contactId,
  });

  const memberIds = new Set((userCommunities ?? []).map((c) => c.communityId));
  const options = Array.from(
    new Map((contactTags ?? []).filter((t) => memberIds.has(t.communityId)).map((t) => [t.communityId, t.communityName])),
    ([communityId, name]) => ({ communityId, name })
  ).sort((a, b) => a.name.localeCompare(b.name));

  if (options.length === 0) return null;

  return (
    <div className="mb-3">
      <label className="form-label small fw-medium mb-1">🏘️ Community <span className="text-muted">(optional)</span></label>
      <select className="form-select form-select-sm" value={selectedCommunityId}
        onChange={(e) => onCommunityChange(e.target.value)} disabled={disabled}>
        <option value="">No community</option>
        {options.map((c) => <option key={c.communityId} value={c.communityId}>{c.name}</option>)}
      </select>
      <small className="text-muted" style={{ fontSize: '0.7rem' }}>
        The community's email group will be notified about this meeting.
      </small>
    </div>
  );
}
