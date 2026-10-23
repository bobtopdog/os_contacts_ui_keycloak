/**
 * Contact ids are now the live service's userId (e.g. "smithD_10"), not UUIDs.
 * Use this wherever a route validated contactId with isValidUuid().
 *
 * Keep isValidUuid() for the app's OWN ids (note, meeting, document, link…),
 * which are still UUIDs.
 */
const CONTACT_ID = /^[A-Za-z0-9._@-]{1,100}$/;

export function isValidContactId(value: unknown): value is string {
  return typeof value === 'string' && CONTACT_ID.test(value);
}
