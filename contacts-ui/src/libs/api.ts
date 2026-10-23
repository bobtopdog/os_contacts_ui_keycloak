import type { ContactDetail, ContactNote, ContactPoc,  ContactSummary, 
  PaginatedResponse, ContactTag, ContactLink, ContactMeeting, MeetingLink, 
  ContactDocument, ContactAnexNote, Team, UserTeam, TeamDetail, TeamMember, 
  ContactHighlights, ContactArea, ContactHighlightNote, Organisation} from '@/types/contact';

import type { OutcomeValue } from '@/types/outcome';
import type { MeetingAssessment } from '@/types/meetingAssessment';

// Contacts now come from the LIVE corporate service, via this app's own
// /api/contacts proxy routes (they add the user's Keycloak token server-side).
// Relative URLs → same origin → no CORS, and the token never reaches the browser.
//
// These three are for CLIENT components. Server components / route handlers
// must import from '@/libs/liveContactsServer' instead.

// Notes are served by this Next.js app's own API routes (direct notes DB connection)
const NOTES_API = process.env.NEXT_PUBLIC_NOTES_API_URL ?? 'http://localhost:3000';

function assertBrowser(fn: string) {
  if (typeof window === 'undefined') {
    throw new Error(
      `${fn}() was called on the server. Import from '@/libs/liveContactsServer' in server code.`);
  }
}

/**
 * People search. The live service returns at most 20 results; when
 * `pagination.total > data.length` show the "refine your search" notice.
 * (`page`/`limit` kept so existing callers still compile — they're ignored.)
 */
export async function searchContacts(
  query: string,
  organisationId = '',
  _page = 1,
  _limit = 20
): Promise<PaginatedResponse<ContactSummary>> {
  assertBrowser('searchContacts');
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (organisationId) params.set('organisation', organisationId);

  const res = await fetch(`/api/contacts?${params.toString()}`, { cache: 'no-store' });
  if (res.status === 401) throw new Error('Your session has expired — please sign in again.');
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json();
}

export async function getContact(id: string): Promise<ContactDetail> {
  assertBrowser('getContact');
  const res = await fetch(`/api/contacts/${encodeURIComponent(id)}`, { cache: 'no-store' });

  if (res.status === 404) throw new Error('Contact not found');
  if (res.status === 401) throw new Error('Your session has expired — please sign in again.');
  if (!res.ok) throw new Error(`Failed to fetch contact: ${res.status}`);

  const json = await res.json();
  return json.data;
}

/** Now returns { id, name } — use id as the <option> value, name as the label. */
export async function getOrganisations(): Promise<Organisation[]> {
  assertBrowser('getOrganisations');
  const res = await fetch('/api/contacts/organisations', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch organisations: ${res.status}`);
  const json = await res.json();
  return json.data;
}

// ---- Notes (read/write, via this app's own API routes on port 3000) -------

export async function getNotes(contactId: string): Promise<ContactNote[]> {
  const res = await fetch(`${NOTES_API}/api/notes/${contactId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch notes: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function getMyNotes(userName: string): Promise<ContactNote[]> {
  const res = await fetch(`${NOTES_API}/api/notes/mynotes/${userName}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch notes: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function postNote(payload: {
  contactId: string;
  username: string;
  comment: string;
}): Promise<ContactNote> {
  const res = await fetch(`${NOTES_API}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to save note: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function patchNote(
  noteId: string,
  username: string,
  comment: string
): Promise<ContactNote> {
  const res = await fetch(`${NOTES_API}/api/notes/note/${noteId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, comment }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to update note: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function deleteNote(
  noteId: string,
  username: string
): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/notes/note/${noteId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to delete note: ${res.status}`);
  }
}

export async function movePrivateNote(
  noteId: string,
  username: string
): Promise<ContactNote> {
  const res = await fetch(`${NOTES_API}/api/notes/note/${noteId}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to move note: ${res.status}`);
  }
  return (await res.json()).data;
}

// ---- PoC(read/write, via this app's own API routes on port 3000) -------

export async function getPoc(contactId: string): Promise<ContactPoc[]> {
  const res = await fetch(`${NOTES_API}/api/poc/${contactId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch notes: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function postPoc(payload: {
  contactId: string;
  username: string;
  details: string;
}): Promise<ContactPoc> {
  const res = await fetch(`${NOTES_API}/api/poc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to save poc: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function deletePoc(
  pocId: string,
  username: string
): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/poc/poc/${pocId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to delete PoC ${res.status}`);
  }
}

// ---- Tag(read/write, via this app's own API routes on port 3000) -------

export async function getTag(contactId: string): Promise<ContactTag[]> {
  const res = await fetch(`${NOTES_API}/api/tag/${contactId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch tags: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function postTag(payload: {
  contactId: string;
  username: string;
  tag: string;
}): Promise<ContactTag> {
  const res = await fetch(`${NOTES_API}/api/tag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to save tag: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function deleteTag(
  tagId: string,
  username: string
): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/tag/tag/${tagId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to delete PoC ${res.status}`);
  }
}


// ---- Links ----------------------------------------------------------------

export async function getLinks(contactId: string): Promise<ContactLink[]> {
  const res = await fetch(`${NOTES_API}/api/links/${contactId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch links: ${res.status}`);

  return (await res.json()).data;
}

export async function postLink(
  payload: { contactId: string; username: string; reference: string; label: string; } & OutcomeValue
): Promise<ContactLink> {
  const res = await fetch(`${NOTES_API}/api/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to save link: ${res.status}`);
  }
  return (await res.json()).data;
}

export async function patchLink(
  linkId: string,
  payload: { username: string; reference: string; label: string } & OutcomeValue
): Promise<ContactLink> {
  const res = await fetch(`${NOTES_API}/api/links/link/${linkId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to update link: ${res.status}`);
  }
  return (await res.json()).data;
}

export async function deleteLink(linkId: string, username: string): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/links/link/${linkId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to delete link: ${res.status}`);
  }
}


// ---- Meetings -------------------------------------------------------------

export async function getMeetings(contactId: string): Promise<ContactMeeting[]> {
  const res = await fetch(`${NOTES_API}/api/meetings/${contactId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch meetings: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function getMyMeetings(userName: string): Promise<ContactMeeting[]> {
  const res = await fetch(`${NOTES_API}/api/meetings/mymeetings/${userName}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch meetings: ${res.status}`);
  const json = await res.json();
  return json.data;
}


export async function postMeeting(payload: {
  contactId: string; username: string; meetingDate: string; title: string;
  notes: string; score1: number; score2: number; score3: number; score4: number; outcomeId: number | null; subOutcomeId: number | null;
  assessment: MeetingAssessment;
}): Promise<ContactMeeting> {
  const res = await fetch(`${NOTES_API}/api/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to save meeting: ${res.status}`);
  }
  return (await res.json()).data;
}

export async function patchMeeting(
  meetingId: string,
  payload: { username: string; meetingDate: string; title: string; notes: string;
             score1: number; score2: number; score3: number; score4: number; outcomeId: number | null; subOutcomeId: number | null;
             assessment: MeetingAssessment; }
): Promise<ContactMeeting> {
  const res = await fetch(`${NOTES_API}/api/meetings/meeting/${meetingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to update meeting: ${res.status}`);
  }
  return (await res.json()).data;
}

export async function deleteMeeting(meetingId: string, username: string): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/meetings/meeting/${meetingId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to delete meeting: ${res.status}`);
  }
}

export async function postMeetingLink(meetingId: string, reference: string): Promise<MeetingLink> {
  const res = await fetch(`${NOTES_API}/api/meetings/meeting/${meetingId}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to add link: ${res.status}`);
  }
  return (await res.json()).data;
}

export async function deleteMeetingLink(meetingId: string, meetingLinkId: string): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/meetings/meeting/${meetingId}/links`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ meetingLinkId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to delete link: ${res.status}`);
  }
}

// ---- Documents ------------------------------------------------------------

export async function getDocuments(contactId: string): Promise<ContactDocument[]> {
  const res = await fetch(`${NOTES_API}/api/documents/${contactId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch documents: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function uploadDocument(
  contactId: string,
  username: string,
  category: string,
  file: File,
  outcome: { outcomeId: number | null; subOutcomeId: number | null },
  onProgress?: (pct: number) => void
): Promise<ContactDocument> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('contactId', contactId);
    formData.append('username', username);
    formData.append('category', category);
    formData.append('file', file);
    formData.append('outcomeId', outcome.outcomeId?.toString() ?? '');
    formData.append('subOutcomeId', outcome.subOutcomeId?.toString() ?? '');

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 201) {
        const json = JSON.parse(xhr.responseText);
        resolve(json.data);
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.message ?? `Upload failed: ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    xhr.open('POST', `${NOTES_API}/api/documents`);
    xhr.send(formData);
  });
}

export function getDownloadUrl(documentId: string): string {
  return `${NOTES_API}/api/documents/download/${documentId}`;
}

export async function deleteDocument(documentId: string, username: string): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/documents/document/${documentId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to delete document: ${res.status}`);
  }
}


// ---- Anex Notes (read/write, via this app's own API routes on port 3000) -------

export async function getAnexNotes(contactId: string): Promise<ContactAnexNote[]> {
  const res = await fetch(`${NOTES_API}/api/anexnotes/${contactId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch anex notes: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function postAnexNote(payload: {
  contactId: string;
  username: string;
  comment: string;
  outcomeId: number | null; 
  subOutcomeId: number | null;
}): Promise<ContactAnexNote> {
  const res = await fetch(`${NOTES_API}/api/anexnotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to save anex note: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function patchAnexNote(
  noteId: string,
  username: string,
  comment: string,
  outcomeId: number | null,
  subOutcomeId: number | null
): Promise<ContactAnexNote> {
  const res = await fetch(`${NOTES_API}/api/anexnotes/note/${noteId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, comment, outcomeId, subOutcomeId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to update anex note: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}


export async function deleteAnexNote(
  noteId: string,
  username: string
): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/anexnotes/note/${noteId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to delete anex note: ${res.status}`);
  }
}

// ---- Profile / Teams ------------------------------------------------------

export async function getProfileTeams(username: string): Promise<{
  allTeams: Team[];
  userTeams: UserTeam[];
}> {
  const res = await fetch(
    `${NOTES_API}/api/profile/teams?username=${encodeURIComponent(username)}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error(`Failed to fetch teams: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function postUserTeam(payload: {
  username: string;
  teamId: string;
  isPrimary: boolean;
}): Promise<UserTeam> {
  const res = await fetch(`${NOTES_API}/api/profile/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to add team: ${res.status}`);
  }
  return (await res.json()).data;
}

export async function deleteUserTeam(
  userTeamId: string,
  username: string
): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/profile/teams/${userTeamId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to remove team: ${res.status}`);
  }
}

// ---- Teams pages ----------------------------------------------------------

export async function getTeamPage(teamId: string): Promise<{
  team: TeamDetail;
  members: TeamMember[];
}> {
  const res = await fetch(`${NOTES_API}/api/teams/${teamId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch team: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function patchTeam(
  teamId: string,
  username: string,
  description: string,
  intranetUrl: string
): Promise<TeamDetail> {
  const res = await fetch(`${NOTES_API}/api/teams/${teamId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, description, intranetUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to update team: ${res.status}`);
  }
  return (await res.json()).data;
}

// ---- Highlights (read/write, via this app's own API routes on port 3000) -------

export async function getHeadlines(contactId: string): Promise<ContactHighlights[]> {
  const res = await fetch(`${NOTES_API}/api/headlines/${contactId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch anex notes: ${res.status}`);
  const json = await res.json();
  return json.data;
}

// ---- Area(read/write, via this app's own API routes on port 3000) -------

export async function getArea(contactId: string): Promise<ContactArea[]> {
  const res = await fetch(`${NOTES_API}/api/area/${contactId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch areas: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function postArea(payload: {
  contactId: string;
  username: string;
  area: string;
}): Promise<ContactArea> {
  const res = await fetch(`${NOTES_API}/api/area`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to save area: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function deleteArea(
  tagId: string,
  username: string
): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/area/area/${tagId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to delete Area ${res.status}`);
  }
}

// ---- highlight Notes (read/write, via this app's own API routes on port 3000) -------

export async function getHighlightNotes(contactId: string): Promise<ContactHighlightNote[]> {
  const res = await fetch(`${NOTES_API}/api/highlightnotes/${contactId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch highlight notes: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function postHighlightNote(payload: {
  contactId: string;
  username: string;
  comment: string;
}): Promise<ContactHighlightNote> {
  const res = await fetch(`${NOTES_API}/api/highlightnotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to save highlight note: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function patchHighlightNote(
  noteId: string,
  username: string,
  comment: string
): Promise<ContactHighlightNote> {
  const res = await fetch(`${NOTES_API}/api/highlightnotes/note/${noteId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, comment }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to update highlight note: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function deleteHighlightNote(
  noteId: string,
  username: string
): Promise<void> {
  const res = await fetch(`${NOTES_API}/api/highlightnotes/note/${noteId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to delete highlight note: ${res.status}`);
  }
}

// -------------------- Communities ------------------------

/* export async function getMyCommunities(userName: string): Promise<CommunityOwner[]> {
  const res = await fetch(`${NOTES_API}/api/communities/mycommunities/${userName}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch meetings: ${res.status}`);
  const json = await res.json();
  return json.data;
} */