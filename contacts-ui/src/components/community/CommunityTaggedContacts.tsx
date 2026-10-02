'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getCommunityContactIds } from '@/libs/communityPagesApi';
import ContactName from '@/components/ContactName';

/** Contacts tagged with this community (existing endpoint), names via ContactName. */
export default function CommunityTaggedContacts({ communityId }: { communityId: string }) {
  const { data: ids, isLoading } = useQuery<string[]>({
    queryKey: ['community-contacts', communityId],
    queryFn: () => getCommunityContactIds(communityId),
  });

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-bottom py-2">
        <h6 className="fw-semibold mb-0">📇 Tagged contacts <span className="badge bg-secondary rounded-pill ms-1">{ids?.length ?? 0}</span></h6>
      </div>
      <div className="card-body py-2">
        {isLoading && <span className="spinner-border spinner-border-sm text-muted" />}
        {ids && ids.length === 0 && <p className="text-muted small mb-0">No contacts tagged yet.</p>}
        {ids?.map((id) => (
          <div key={id} className="py-1 border-bottom small">
            <Link href={`/contacts/${id}`} className="text-decoration-none">📇 <ContactName contactId={id} /></Link>
          </div>
        ))}
      </div>
    </div>
  );
}
