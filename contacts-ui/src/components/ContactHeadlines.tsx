'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHeadlines } from '@/libs/api';
import type { ContactHighlights } from '@/types/contact';

interface Props {
  contactId: string;
}

function PocCard({
  highlight,
}: {
  highlight: ContactHighlights;
}) {

  const [error, setError] = useState('');

  return (
    <div className={`card border-0 mb-1 `}>
      <div className="card-body py-2 px-3">   
          <>
          <div className=" border-bottom">
          <div className="text-muted small">{highlight.source} </div>
            <div className="fw-medium" style={{ whiteSpace: 'pre-wrap' }}>{highlight.value}</div> 
            <div className="text-muted small">{new Date(highlight.created_at).toLocaleString()}</div> 
            </div>
          </>
      </div>
    </div>
  );
}

export default function ContactHighlights({ contactId }: Props) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [details, setDetails] = useState('');


  const username = session?.user?.username ?? '';

  const { data: highlights, isLoading, isError } = useQuery<ContactHighlights[]>({
    queryKey: ['highlights', contactId],
    queryFn: () => getHeadlines(contactId),
  });

  
  return (
    <div className="mt-2">
      
      {isLoading && (
        <div className="text-center text-muted py-3">
          <span className="spinner-border spinner-border-sm me-2" />Loading Poc…
        </div>
      )}

      {isError && (
        <div className="alert alert-warning py-2 small">Could not load highlights. Please try refreshing.</div>
      )}

      {highlights && highlights.length === 0 && (
        <p className="text-muted small">No highlights yet for this contact.</p>
      )}

      {highlights && highlights.length > 0 && (
        <div>
          {highlights.map((highlight) => (
            <PocCard
              key={highlight.source}
              highlight={highlight}
            />
          ))}
        </div>
      )}
    </div>
  );
}

