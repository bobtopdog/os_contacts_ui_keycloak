'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHeadlines } from '@/libs/api';
import type { ContactHighlights } from '@/types/contact';
import ContactHighlightNotes from '@/components/ContactHighlightNotes';

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
    <div className="col">
      <div className={`card border-1 mb-1 `}>
        <div className="card-header text-muted small">{highlight.source} </div>
        <div className="card-body py-2 px-3">
          <>


            <div className="fw-medium" style={{ whiteSpace: 'pre-wrap' }}>{highlight.value}</div>
            <div className="text-muted small">{new Date(highlight.created_at).toLocaleString()}</div>

          </>
        </div>
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
    <div className="mt-1">
      <div className="row">
        <div className="col">
          
          <div className="accordion  shadow border-0 mb-2" id="accordionHeadlines">
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingNote">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOneNote" aria-expanded="false" aria-controls="collapseOneNote">
                  <div className="text-muted small">Notes</div>
                </button>
              </h2>
              <div id="collapseOneNote" className="accordion-collapse collapse" aria-labelledby="headingNote" data-bs-parent="#accordionHeadlines">
                <div className="accordion-body text-muted " >
                   <ContactHighlightNotes contactId={contactId} />
                </div>
              </div>
            </div>
</div>




        </div>
      </div>

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
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-2 g-4">
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

