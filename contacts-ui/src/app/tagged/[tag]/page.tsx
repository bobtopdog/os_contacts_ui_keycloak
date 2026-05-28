import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getTagContactIds } from '@/libs/tagsRepository';
import { getContact } from '@/libs/api';
import ContactCard from '@/components/ContactCard';
import type { ContactDetail } from '@/types/contact';
import Link from 'next/link';

interface Props {
  params: Promise<{ tag: string }>;
}

export default async function TaggedContactsPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const username = session?.user?.username ?? '';
  const { tag } = await params;

  // Step 1 — get all contact_ids for this user from the notes DB
  let contactIds: string[] = [];
  try {
    contactIds = await getTagContactIds(tag);
  } catch (err) {
    console.error('Failed to fetch tag contact IDs:', err);
  }

  // Step 2 — fetch each contact from the contacts API in parallel
  let contacts: ContactDetail[] = [];
  if (contactIds.length > 0) {
    const results = await Promise.allSettled(
      contactIds.map((id) => getContact(id))
    );

    // Only include successfully resolved contacts
    contacts = results
      .filter((r): r is PromiseFulfilledResult<ContactDetail> => r.status === 'fulfilled')
      .map((r) => r.value);
  }

  return (
    <>
      <div className="mb-4">
        <p className="lead ">Tagged Contacts</p>
        <p className="text-muted mb-0">
          Contacts that have been tagged: <b>{tag}</b>
        </p>
      </div>

      {/* Empty state */}
      {contacts.length === 0 && (
        <div className="text-center text-muted py-5">
          <div style={{ fontSize: '3rem' }}>📋</div>
          <p className="mt-2">No contacts have yet been tagged as {tag} </p>
          
        </div>
      )}

      {/* Results count */}
      {contacts.length > 0 && (
        <>
          <p className="text-muted small mb-3">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} found
          </p>

          {/* Reuse the same card grid as search results */}
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
            {contacts.map((contact) => (
              <div key={contact.personId} className="col">
                <ContactCard contact={contact} />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
