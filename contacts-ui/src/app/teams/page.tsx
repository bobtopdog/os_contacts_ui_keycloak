import { Suspense } from 'react';
import { searchContacts, getOrganisations } from '@/libs/api';
import ContactCard from '@/components/ContactCard';
import SearchBar from '@/components/SearchBar';
import Pagination from '@/components/Pagination';
import TeamButtons from '@/components/TeamButtons';
import type {Organisation} from '@/types/contact'
import {getLiveOrganisations, searchLivePeople} from '@/libs/liveContactsServer'



interface HomeProps {
  searchParams: Promise<{ q?: string; organisation?: string; page?: string }>;
}

export default async function HomePage({ searchParams }: HomeProps) {
  const { q, organisation, page: pageStr } = await searchParams;
  const query = q ?? '';
  const selectedOrg = organisation ?? '';
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1);


  let organisations: Organisation[] = [];
    try {
      organisations = await getLiveOrganisations();
    } catch (err) {
      // Non-fatal — dropdown will just be empty
      console.error('Failed to load organisations for the dropdown' ,err);
    }

  let results = null;
  let error = '';

  if (query || selectedOrg) {
    try {
      results = await searchContacts(query, selectedOrg, page);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Something went wrong';
    }
  }

  return (
    <>
      <div className="mb-4">
        <h1 className="h3 fw-bold mb-1">Find a Contact</h1>
        <p className="text-muted mb-3">
          Search by name, role or email — or filter by organisation.
        </p>

        {/* Team buttons above search bar */}
        <Suspense>
          <TeamButtons />
        </Suspense>

        <Suspense>
          <SearchBar organisations={organisations} />
        </Suspense>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">⚠️ {error}</div>
      )}

      {!query && !selectedOrg && !error && (
        <div className="text-center text-muted py-5">
          <div style={{ fontSize: '3rem' }}>📇</div>
          <p className="mt-2">Start typing or select an organisation to find contacts.</p>
        </div>
      )}

      {results && results.data.length === 0 && (
        <div className="text-center text-muted py-5">
          <div style={{ fontSize: '3rem' }}>🔍</div>
          <p className="mt-2">No contacts found matching your search.</p>
        </div>
      )}

      {results && results.data.length > 0 && (
        <>
          <p className="text-muted small mb-3">
            Showing {results.data.length} of {results.pagination.total} result
            {results.pagination.total !== 1 ? 's' : ''}
          </p>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
            {results.data.map((contact) => (
              <div key={contact.personId} className="col">
                <ContactCard contact={contact} />
              </div>
            ))}
          </div>
          <Suspense>
            <Pagination
              currentPage={results.pagination.page}
              totalPages={results.pagination.totalPages}
            />
          </Suspense>
        </>
      )}
    </>
  );
}
