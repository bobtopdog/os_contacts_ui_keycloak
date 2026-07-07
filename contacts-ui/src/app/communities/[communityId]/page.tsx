import Link from 'next/link';
import { getContact } from '@/libs/api';
import ContactCard from '@/components/ContactCard';
import type { ContactDetail } from '@/types/contact';

interface Props {
  params: Promise<{ communityId: string }>;
}

const NOTES_API = process.env.NEXT_PUBLIC_NOTES_API_URL ?? 'http://localhost:3000';

export default async function CommunityContactsPage({ params }: Props) {
  const { communityId } = await params;

  // Step 1 — get all contact IDs tagged with this community
  let contactIds: string[] = [];
  try {
    const res = await fetch(`${NOTES_API}/api/communities/${communityId}/contacts`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      contactIds = json.data ?? [];
    }
  } catch (err) {
    console.error('Failed to fetch tagged contact IDs:', err);
  }

  // Step 2 — fetch each contact from the contacts API in parallel
  // Use Promise.allSettled so a single failure doesn't break the page
  let contacts: ContactDetail[] = [];
  if (contactIds.length > 0) {
    const results = await Promise.allSettled(
      contactIds.map((id) => getContact(id))
    );
    contacts = results
      .filter((r): r is PromiseFulfilledResult<ContactDetail> => r.status === 'fulfilled')
      .map((r) => r.value);
  }

  return (
    <>
      <Link href="/" className="back-link text-primary d-inline-flex align-items-center gap-1 mb-4">
        ← Back to home
      </Link>

      <div className="mb-4">
        <h1 className="h3 fw-bold mb-1">🏘️ Tagged Contacts</h1>
        <p className="text-muted mb-0">
          {contacts.length} contact{contacts.length !== 1 ? 's' : ''} tagged with this community.
        </p>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center text-muted py-5">
          <div style={{ fontSize: '3rem' }}>📇</div>
          <p className="mt-2">No contacts have been tagged with this community yet.</p>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
          {contacts.map((contact) => (
            <div key={contact.personId} className="col">
              <ContactCard contact={contact} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
