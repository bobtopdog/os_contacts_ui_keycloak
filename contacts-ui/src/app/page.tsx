import { Suspense } from 'react';
import { searchContacts, getOrganisations } from '@/libs/api';
import ContactCard from '@/components/ContactCard';
import SearchBar from '@/components/SearchBar';
import Pagination from '@/components/Pagination';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { warmupNotesPool } from '@/libs/warmup';

interface HomeProps {
  searchParams: Promise<{ q?: string; organisation?: string; page?: string }>;
}
warmupNotesPool();
export default async function HomePage({ searchParams }: HomeProps) {
  const { q, organisation, page: pageStr } = await searchParams;
  const query = q ?? '';
  const selectedOrg = organisation ?? '';
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1);
  const session = await getServerSession(authOptions);

  // Load organisations for the dropdown (once, on every page render)
  let organisations: string[] = [];
  try {
    organisations = await getOrganisations();
  } catch {
    // Non-fatal — dropdown will just be empty
  }

  let results = null;
  let error = '';

  // Search if there's a query OR an organisation filter active {session?.user.name}
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
        <p className="lead">Find a Contact</p>
        <p className="text-muted">
          Search by name, role or email — or filter by organisation.
        </p>
        <Suspense>
          <SearchBar organisations={organisations} />
        </Suspense>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-danger" role="alert">
          ⚠️ {error}
        </div>
      )}

      {/* Empty prompt — nothing typed yet */}
      {!query && !selectedOrg && !error && (
        <div className="text-center text-muted py-5">
          
          <p className="mt-2">Start typing or select an organisation to find contacts.</p>
        </div>
      )}

      {/* No results */}
      {results && results.data.length === 0 && (
        <div className="text-center text-muted py-5">
          
          <p className="mt-2">No contacts found matching your search.</p>
        </div>
      )}

      {/* Results grid */}
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
