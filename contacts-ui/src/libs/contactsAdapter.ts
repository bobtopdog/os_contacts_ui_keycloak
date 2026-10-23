// ===========================================================================
// THE ADAPTER — the only file that knows the live contacts service's shapes.
//
// Everything else in the app keeps using its own ContactSummary /
// ContactDetail types (personId, fullName, role, …). When the live service
// changes again, this file is the only one that should need to.
// ===========================================================================

import type { ContactSummary, ContactDetail, Organisation } from '@/types/contact';

// ---- Live shapes (as the service sends them) ------------------------------

export interface LivePerson {          // GET /api/v1/people → people[]
  userID?: string;                     // ⚠️ capital D on /people …
  userId?: string;                     //    … lower-case d on /profiles — accept both
  firstname?: string;
  surname?: string;
  organisation?: string;
  description?: string;
  email?: string;
  worktelephone?: string;
  telephone?: string;
}

export interface LivePeopleResponse {
  people: LivePerson[] | null;         // ⚠️ null (not []) when nothing matches
  peopleCount: number;
  peopletotalCount: number;
}

export interface LiveProfile {         // GET /api/v1/profiles/{userId}
  userID?: string;
  userId?: string;
  firstname?: string;
  surname?: string;
  organisation?: string;
  title?: string;
  email?: string;
  workphone?: string;                  // ⚠️ "workphone" here, "worktelephone" on /people
  telephone?: string;
  mod_date?: string;
}

export interface LiveOrganisation {    // GET /api/v1/organisations → organisations[]
  id: string;
  name: string;
  iconURL?: string;
  keycloakOrgName?: string;
  partnerCommunityMetaId?: string;
  peopleSearchOrgName?: string;
  peopleSearchType?: string;
}

export interface LiveOrganisationsResponse {
  organisations: LiveOrganisation[] | null;
  organisationcount?: number;
}

// ---- Helpers ---------------------------------------------------------------

/**
 * firstname + surname, without doubling the surname. The sample data has
 * firstname "David Jones" with surname "Jones"; a plain join would give
 * "David Jones Jones". If firstname already ends with the surname, use it as-is.
 */
export function joinName(firstname?: string, surname?: string): string {
  const f = (firstname ?? '').trim();
  const s = (surname ?? '').trim();
  if (!s) return f;
  if (!f) return s;
  return f.toLowerCase().endsWith(s.toLowerCase()) ? f : `${f} ${s}`;
}

function idOf(p: { userID?: string; userId?: string }): string {
  return (p.userID ?? p.userId ?? '').trim();
}

// ---- Mappers: live shape → app shape ---------------------------------------

export function toContactSummary(p: LivePerson): ContactSummary {
  return {
    personId: idOf(p),
    fullName: joinName(p.firstname, p.surname),
    organisation: p.organisation ?? '',
    role: p.description ?? '',
    email: p.email ?? '',
    workPhone: p.worktelephone ?? '',
    homePhone: p.telephone ?? '',
  };
}

export function toContactDetail(p: LiveProfile): ContactDetail {
  return {
    personId: idOf(p),
    fullName: joinName(p.firstname, p.surname),
    organisation: p.organisation ?? '',
    role: p.title ?? '',
    email: p.email ?? '',
    workPhone: p.workphone ?? '',
    homePhone: p.telephone ?? '',
    createdAt: '',                     // not provided by the live service
    updatedAt: p.mod_date ?? '',
  };
}

export function toOrganisation(o: LiveOrganisation): Organisation {
  return { id: o.id, name: o.name };
}

/** null-safe list + drop any row without an id (it couldn't be linked to). */
export function mapPeople(res: LivePeopleResponse): ContactSummary[] {
  return (res.people ?? []).map(toContactSummary).filter((c) => c.personId);
}
