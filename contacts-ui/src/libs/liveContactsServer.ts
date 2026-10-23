// SERVER ONLY — calls the live contacts service with the user's Keycloak token.
//
//   • Route handlers and server components import from HERE.
//   • Client components keep using searchContacts / getContact / getOrganisations
//     from api.ts, which call this app's /api/contacts proxy routes.
//
// Env: LIVE_CONTACTS_API_URL = https://<url>/api/v1   (no trailing slash needed)

import { getAccessToken } from './keycloakToken';
import {
  mapPeople, toContactDetail, toOrganisation,
  type LivePeopleResponse, type LiveProfile, type LiveOrganisationsResponse,
} from './contactsAdapter';
import type { ContactDetail, ContactSummary, Organisation, PaginatedResponse } from '@/types/contact';

/** Thrown when there's no usable token or the service rejects it (→ HTTP 401). */
export class LiveAuthError extends Error {
  constructor(message = 'Not authorised to call the contacts service.') {
    super(message);
    this.name = 'LiveAuthError';
  }
}

/** The service returns at most this many people per search (data protection). */
export const LIVE_MAX_RESULTS = 20;

function baseUrl(): string {
  const base = process.env.LIVE_CONTACTS_API_URL;
  if (!base) throw new Error('LIVE_CONTACTS_API_URL is not set.');
  return base.replace(/\/+$/, '');
}

async function liveGet<T>(path: string): Promise<T | null> {
  const token = await getAccessToken();
  if (!token) throw new LiveAuthError('No Keycloak access token in the session.');

  const res = await fetch(`${baseUrl()}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  });

  if (res.status === 401 || res.status === 403) {
    throw new LiveAuthError(`Contacts service refused the token (${res.status}).`);
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Contacts service error ${res.status} for ${path}`);
  return (await res.json()) as T;
}

/**
 * People search. Optional organisation id (a UUID from getLiveOrganisations).
 * Returns the app's PaginatedResponse shape so existing callers don't change:
 * there's only ever one page; `pagination.total` is the full match count, so
 * `total > data.length` means "refine your search".
 */
export async function searchLivePeople(
  searchTerm: string, organisationId = ''
): Promise<PaginatedResponse<ContactSummary>> {
  const term = searchTerm.trim();
  const org = organisationId.trim();

  if (!term && !org) {
    return { data: [], pagination: { total: 0, page: 1, limit: LIVE_MAX_RESULTS, totalPages: 0 } };
  }

  const params = new URLSearchParams({ orderBy: 'nameAlphabetical' });
  if (term) params.set('searchTerm', term);
  if (org) params.set('organisation', org);

  const res = await liveGet<LivePeopleResponse>(`/people?${params.toString()}`);
  const data = res ? mapPeople(res) : [];
  const total = Math.max(res?.peopletotalCount ?? 0, data.length);

  return {
    data,
    pagination: { total, page: 1, limit: LIVE_MAX_RESULTS, totalPages: data.length ? 1 : 0 },
  };
}

/** One person's profile, or null if not found. */
export async function getLiveProfile(personId: string): Promise<ContactDetail | null> {
  const res = await liveGet<LiveProfile>(`/profiles/${encodeURIComponent(personId)}`);
  return res ? toContactDetail(res) : null;
}

/** Organisations for the dropdown, sorted by name. */
export async function getLiveOrganisations(): Promise<Organisation[]> {
  const res = await liveGet<LiveOrganisationsResponse>('/organisations');
  return (res?.organisations ?? [])
    .map(toOrganisation)
    .sort((a, b) => a.name.localeCompare(b.name));
}
