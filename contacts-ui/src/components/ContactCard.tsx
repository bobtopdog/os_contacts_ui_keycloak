import Link from 'next/link';
import type { ContactSummary } from '@/types/contact';
import Icon from '@mdi/react'
import { mdiPhone, mdiEmail , mdiDomain} from '@mdi/js';

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ContactCard({ contact }: { contact: ContactSummary }) {
  return (
    <Link
      href={`/contacts/${contact.personId}`}
      className="contact-card card h-100 shadow-sm border-0"
    >
      <div className="card-body d-flex flex-column gap-3">
        {/* Header row: avatar + name/role */}
        <div className="d-flex align-items-center gap-3">
          <div className="avatar">{initials(contact.fullName)}</div>
          <div className="overflow-hidden">
            <h5 className="card-title mb-0 text-truncate">{contact.fullName}</h5>
            <small className="text-muted text-truncate d-block">{contact.role || '—'}</small>
          </div>
        </div>

        {/* Organisation */}
        {contact.organisation && (
          <div className="d-flex align-items-center gap-2 text-secondary small">
            <span><Icon path={mdiDomain} size={1} /></span>
            <span className="text-truncate">{contact.organisation}</span>
          </div>
        )}

        {/* Email */}
        {contact.email && (
          <div className="d-flex align-items-center gap-2 text-secondary small">
            <span><Icon path={mdiEmail} size={1} /></span>
            <span className="text-truncate">{contact.email}</span>
          </div>
        )}

        {/* Phone */}
        {contact.workPhone && (
          <div className="d-flex align-items-center gap-2 text-secondary small">
            <span><Icon path={mdiPhone} size={1} /></span>
            <span>{contact.workPhone}</span>
          </div>
        )}
      </div>

      <div className="card-footer bg-transparent border-top-0 text-end">
        <small className="text-primary fw-semibold">View details →</small>
      </div>
    </Link>
  );
}
