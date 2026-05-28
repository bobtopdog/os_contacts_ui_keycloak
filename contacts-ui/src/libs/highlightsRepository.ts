import { notesQuery } from './notesDb';
import type { ContactHighlights } from '@/types/contact';

interface HighlightRow {
  source: string;
  value: string;
  created_at: string;
  
}

function toHighlight(row: HighlightRow): ContactHighlights {
  return {
    source: row.source,
    value: row.value,
    created_at: row.created_at,
  };
}

// Fetch all links for a contact, newest first
export async function getHighlightsByContactId(contactId: string): Promise<ContactHighlights[]> {
  const rows = await notesQuery<HighlightRow>(
    `SELECT value, source, created_at
     FROM public.get_contact_latest_activity($1)`,
    [contactId]
  );
  return rows.map(toHighlight);
}