'use client';

import { use } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCommunityDetail } from '@/libs/communityPagesApi';
import CommunityPoc from '@/components/community/CommunityPoc';
import CommunityHeadlines from '@/components/community/CommunityHeadlines';
import CommunityNotes from '@/components/community/CommunityNotes';
import CommunityCalendar from '@/components/community/CommunityCalendar';
import CommunityMembers from '@/components/community/CommunityMembers';
import CommunityEmailGroup from '@/components/community/CommunityEmailGroup';
import CommunityTaggedContacts from '@/components/community/CommunityTaggedContacts';
import type { CommunityDetail } from '@/types/communityPages';

interface Props { params: Promise<{ communityId: string }>; }

/** Community homepage — everyone can view; members contribute; owner manages. */
export default function CommunityHomePage({ params }: Props) {
  const { communityId } = use(params);
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const username = session?.user?.username ?? '';

  const { data: c, isLoading, isError } = useQuery<CommunityDetail>({
    queryKey: ['community-detail', communityId, username],
    queryFn: () => getCommunityDetail(communityId, username),
    enabled: !!username,
  });

  if (status === 'loading' || isLoading) {
    return <div className="text-center text-muted py-5"><span className="spinner-border" /></div>;
  }
  if (isError || !c) {
    return (
      <>
        <Link href="/communities" className="back-link text-primary d-inline-flex align-items-center gap-1 mb-4">← Back to communities</Link>
        <div className="alert alert-warning">Community not found.</div>
      </>
    );
  }

  return (
    <>
      <Link href="/communities" className="back-link text-primary d-inline-flex align-items-center gap-1 mb-4">← Back to communities</Link>

      {/* Header */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-secondary text-white py-4">
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div>
              <h1 className="h3 fw-bold mb-1">🏘️ {c.name}</h1>
              {c.description && <p className="mb-1 opacity-75">{c.description}</p>}
              <small className="opacity-75">Created by {c.createdBy} &middot; {c.memberCount} member{c.memberCount !== 1 ? 's' : ''}</small>
            </div>
            <div className="d-flex gap-1">
              {c.isCreator && <span className="badge bg-success rounded-pill">owner</span>}
              {!c.isCreator && c.isMember && <span className="badge bg-light text-dark rounded-pill">member</span>}
              {!c.isMember && <span className="badge bg-secondary rounded-pill">viewing</span>}
            </div>
          </div>
        </div>
        {!c.isMember && (
          <div className="card-body py-2">
            <small className="text-muted">You can view this community. Only members can add PoCs, headlines and notes; the owner adds members.</small>
          </div>
        )}
      </div>

      <div className="row g-4">
        {/* Main column */}
        <div className="col-12 col-lg-8">
          <CommunityPoc communityId={communityId} username={username} isMember={c.isMember} />
          <CommunityHeadlines communityId={communityId} username={username} isMember={c.isMember} />
          <CommunityNotes communityId={communityId} username={username} isMember={c.isMember} />
          <CommunityTaggedContacts communityId={communityId} />
        </div>

        {/* Sidebar */}
        <div className="col-12 col-lg-4">
          <CommunityCalendar communityId={communityId} />
          <CommunityMembers
            communityId={communityId} username={username}
            createdBy={c.createdBy} isCreator={c.isCreator}
            onChanged={() => queryClient.invalidateQueries({ queryKey: ['community-detail', communityId, username] })}
          />
          {c.groupId && (
            <CommunityEmailGroup
              groupId={c.groupId} groupName={c.groupName ?? c.name}
              username={username} communityCreator={c.createdBy} isCreator={c.isCreator}
            />
          )}
        </div>
      </div>
    </>
  );
}
