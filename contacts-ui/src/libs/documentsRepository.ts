import { notesQuery } from './notesDb';
import type { ContactDocument } from '@/types/contact';

interface DocumentRow {
  document_id: string;
  contact_id: string;
  username: string;
  filename: string;
  mime_type: string;
  file_size: number;
  category: string;
  created_at: Date;
  outcome_id: number | null;
  sub_outcome_id: number | null;
}

interface DocumentRowWithData extends DocumentRow {
  file_data: Buffer;
}

function toDocument(row: DocumentRow): ContactDocument {
  return {
    documentId: row.document_id,
    contactId: row.contact_id,
    username: row.username,
    filename: row.filename,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    category: row.category ?? '',
    createdAt: row.created_at.toISOString(),
    outcomeId: row.outcome_id,
    subOutcomeId: row.sub_outcome_id, 
  };
}

// List all documents for a contact — no file_data to keep it fast
export async function getDocumentsByContactId(contactId: string): Promise<ContactDocument[]> {
  const rows = await notesQuery<DocumentRow>(
    `SELECT document_id, contact_id, username, filename, mime_type, file_size, category, created_at, outcome_id, sub_outcome_id
     FROM contact_documents
     WHERE contact_id = $1
     ORDER BY created_at DESC`,
    [contactId]
  );
  return rows.map(toDocument);
}

// Fetch a single document including its binary data for download
export async function getDocumentById(
  documentId: string
): Promise<{ meta: ContactDocument; data: Buffer } | null> {
  const rows = await notesQuery<DocumentRowWithData>(
    `SELECT document_id, contact_id, username, filename, mime_type, file_size, category, file_data, created_at, outcome_id, sub_outcome_id 
     FROM contact_documents
     WHERE document_id = $1`,
    [documentId]
  );
  if (!rows.length) return null;
  return { meta: toDocument(rows[0]), data: rows[0].file_data };
}

// Store a new document
export async function createDocument(
  contactId: string,
  username: string,
  filename: string,
  mimeType: string,
  fileSize: number,
  category: string,
  fileData: Buffer,
  outcome_id: number | null,
  sub_outcome_id: number | null
): Promise<ContactDocument> {
  const rows = await notesQuery<DocumentRow>(
    `INSERT INTO contact_documents
       (contact_id, username, filename, mime_type, file_size, category, file_data, outcome_id, sub_outcome_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING document_id, contact_id, username, filename, mime_type, file_size, category, created_at,
               outcome_id, sub_outcome_id`,
    [contactId, username, filename, mimeType, fileSize, category, fileData, outcome_id, sub_outcome_id]
  );
  return toDocument(rows[0]);
}

// Delete a document — owner check enforced at DB level
export async function deleteDocument(
  documentId: string,
  username: string
): Promise<boolean> {
  const rows = await notesQuery<{ document_id: string }>(
    `DELETE FROM contact_documents
     WHERE document_id = $1 AND username = $2
     RETURNING document_id`,
    [documentId, username]
  );
  return rows.length > 0;
}
