import Link from 'next/link';
import { getContact } from '@/libs/api';
import { notFound } from 'next/navigation';
import ContactNotes from '@/components/ContactNotes';
import ContactPoc from '@/components/ContactPoc'
import ContactTags from '@/components/ContactTag';
import ContactAnex from '@/components/ContactAnex';
import ContactHighlights from '@/components/ContactHeadlines';
import ContactAreas from '@/components/ContactArea'
import ContactCommunityTags from '@/components/ContactCommunityTag';


import Icon from '@mdi/react'
import { mdiLabelMultipleOutline, mdiAccountGroup, mdiNoteMultipleOutline, mdiFileDocumentMultipleOutline, mdiPhone, mdiEmail, mdiDomain, mdiPhoneClassic } from '@mdi/js';



interface Props {
  params: Promise<{ id: string }>;
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="d-flex align-items-start gap-3 py-2 border-bottom">
      <span style={{ fontSize: '1.2rem', width: '1.5rem', textAlign: 'center' }}><Icon path={icon} size={1} /></span>
      <div>
        <div className="text-muted small">{label}</div>
        {label === 'Email' ? (
          <div className="fw-medium"><a href='mailto:{value}'>{value}</a></div>
        ) : (
          <div className="fw-medium">{value}</div>
        )}
      </div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params;

  let contact;
  try {
    contact = await getContact(id);
  } catch (err) {
    if (err instanceof Error && err.message === 'Contact not found') notFound();
    throw err;
  }

  return (
    <>
      {/* Back link */}


      <div className="row justify-content-center">
        <p className="lead">Contact Details</p>
        <div className="col-8 col-md-8 col-lg-6">
          <div className="card shadow border-0">

            {/* Card header with avatar + name */}
            <div className="card-header bg-secondary text-white py-4">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="avatar"
                  style={{ background: 'rgba(255,255,255,0.25)', fontSize: '1.4rem', width: '64px', height: '64px' }}
                >
                  {initials(contact.fullName)}
                </div>
                <div>
                  <h2 className="h4 mb-0 fw-bold">{contact.fullName}</h2>
                  {contact.role && (
                    <div className="opacity-75 mt-1">{contact.role}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Card body with all fields */}
            <div className="card-body px-4 py-3">
              <DetailRow icon={mdiDomain} label="Organisation" value={contact.organisation} />
              <DetailRow icon={mdiEmail} label="Email" value={contact.email} />
              <DetailRow icon={mdiPhone} label="Work Phone" value={contact.workPhone} />
              <DetailRow icon={mdiPhoneClassic} label="Home Phone" value={contact.homePhone} />
            </div>

            {/* Footer with meta */}
            <div className="card-footer text-muted small d-flex justify-content-between">
              <span>ID: <code>{contact.personId}</code></span>
              <span>Updated {new Date(contact.updatedAt).toLocaleDateString('en-GB')}</span>
            </div>

          </div>
          <div className='row pt-4'>
            <div className='col'>


              <ContactTags contactId={contact.personId} />
            </div>
            <div className='col'>
              <ContactAreas contactId={contact.personId} />
            </div>
          </div>
          <div className='row pt-4'>
            <div className='col'>
              <ContactCommunityTags contactId={contact.personId} />
            </div>
          </div>



        </div>
        <div className="col-4 col-md-8 col-lg-6">

          <div className="accordion  shadow border-0" id="accordionExample">
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingOne">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="false" aria-controls="collapseOne">
                  <Icon path={mdiLabelMultipleOutline} size={1} title="PoC" color="blue" />&nbsp;
                  NCF - Self-elected points of contact
                </button>
              </h2>
              <div id="collapseOne" className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionExample">
                <div className="accordion-body">
                  <ContactPoc contactId={contact.personId} />
                </div>
              </div>
            </div>

            <div className="accordion-item">
              <h2 className="accordion-header" id="headingTwo">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="true" aria-controls="collapseTwo">
                  <Icon path={mdiNoteMultipleOutline} size={1} title="Headlines" color="blue" />&nbsp;
                  Headlines - Latest additions/updates
                </button>
              </h2>
              <div id="collapseTwo" className="accordion-collapse collapse show" aria-labelledby="headingTwo" data-bs-parent="#accordionExample">
                <div className="accordion-body  scroll100 ">
                  <ContactHighlights contactId={contact.personId} />
                </div>
              </div>
            </div>

            <div className="accordion-item">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                  <Icon path={mdiFileDocumentMultipleOutline} size={1} title="Annex" color="blue" />&nbsp;
                  Annex
                </button>
              </h2>
              <div id="collapseThree" className="accordion-collapse collapse" data-bs-parent="#accordionExample">
                <div className="accordion-body">
                  <ContactAnex contactId={contact.personId} />
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFour" aria-expanded="false" aria-controls="collapseFour">
                  <Icon path={mdiFileDocumentMultipleOutline} size={1} title="Private Notes" color="blue" />&nbsp;
                  Private notes
                </button>
              </h2>
              <div id="collapseFour" className="accordion-collapse collapse" data-bs-parent="#accordionExample">
                <div className="accordion-body scroll100 ">

                  <ContactNotes contactId={contact.personId} />
                </div>
              </div>
            </div>
          </div>



        </div>
      </div>
    </>
  );
}
