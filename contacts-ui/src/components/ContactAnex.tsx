import Link from 'next/link';
import Icon from '@mdi/react'
import type { ContactSummary } from '@/types/contact';
import { mdiLinkBoxVariantOutline, mdiTextBoxMultipleOutline, mdiText, mdiCardAccountDetailsStarOutline } from '@mdi/js';

interface Props {
  contactId: string;
}
import ContactAnexNotes from '@/components/ContactAnexNotes';
import ContactLinks from '@/components/ContactLinks';
import ContactMeetings from '@/components/ContactMeetings';
import ContactDocuments from '@/components/ContactDocuments';


export default function ContactAnex({ contactId }: Props) {
  return (
       <> 
    <div className="row g-3 align-items-left">
        <div className="col-auto">
          <button type="button" className="btn btn-sm btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#discoveryModal">
          <Icon path={mdiLinkBoxVariantOutline} size={1} /> Discovery</button>
          </div>
        <div className="col-auto">
          <button type="button" className="btn btn-sm btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#uploadModal">
          <Icon path={mdiTextBoxMultipleOutline} size={1} /> Uploads</button>
          </div>
        <div className="col-auto">
          <button type="button" className="btn btn-sm btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#notesModal">
          <Icon path={mdiText} size={1} /> Notes</button>
          </div>
        <div className="col-auto">
          <button type="button" className="btn btn-sm btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#scoringModal">
          <Icon path={mdiCardAccountDetailsStarOutline} size={1} /> Meetings & Scoring</button>
        </div>
    </div>
   
    <div className="modal fade" id="discoveryModal" data-bs-backdrop="static" tabIndex={-1} aria-labelledby="discoveryModalLabel" aria-hidden="true">
  <div className="modal-dialog modal-lg  modal-dialog-scrollable">
    <div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title" id="discoveryModalLabel">Discovery Links</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <ContactLinks contactId={contactId} />
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>

  <div className="modal fade" id="uploadModal" data-bs-backdrop="static" tabIndex={-1} aria-labelledby="uploadModalLabel" aria-hidden="true">
  <div className="modal-dialog modal-lg modal-dialog-scrollable">
    <div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title" id="uploadModalLabel">Uploads</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <ContactDocuments contactId={contactId} />
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>

  <div className="modal fade" id="notesModal" data-bs-backdrop="static" tabIndex={-1} aria-labelledby="notesModalLabel" aria-hidden="true">
  <div className="modal-dialog modal-lg  modal-dialog-scrollable">
    <div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title" id="notesModalLabel">Notes</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
       <ContactAnexNotes contactId={contactId} />
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>

  <div className="modal fade" id="scoringModal" data-bs-backdrop="static" tabIndex={-1} aria-labelledby="scoringModalLabel" aria-hidden="true">
  <div className="modal-dialog modal-lg modal-dialog-scrollable">
    <div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title" id="scoringModalLabel">Meetings & Scoring</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body scroll110 ">
        <ContactMeetings contactId={contactId} />
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>
    </>
    



  );
}

