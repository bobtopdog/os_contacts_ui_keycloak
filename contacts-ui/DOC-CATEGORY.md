# Document Category Dropdown — Integration

## Files in this zip

| File | Action |
|------|--------|
| `scripts/migrate-document-category.js` | New — run once |
| `src/libs/documentConfig.ts` | REPLACE (adds DOCUMENT_CATEGORIES + isValidCategory) |
| `src/libs/documentsRepository.ts` | REPLACE (category in row/insert/selects) |
| `src/app/api/documents/route.ts` | REPLACE (validates category against the whitelist) |
| `src/components/ContactDocuments.tsx` | REPLACE (dropdown + badges) |

If you've locally modified any of these since I originally delivered them,
diff before replacing rather than overwriting blind.

## Two small manual patches

### 1. src/types/contact.ts — add to the ContactDocument interface:

    category: string;

### 2. src/libs/api.ts — update uploadDocument. The signature gains a
category parameter (third position) and one formData line:

    export async function uploadDocument(
      contactId: string,
      username: string,
      category: string,              // ← NEW
      file: File,
      onProgress?: (pct: number) => void
    ): Promise<ContactDocument> {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('contactId', contactId);
        formData.append('username', username);
        formData.append('category', category);   // ← NEW
        formData.append('file', file);
        ...rest unchanged
      });
    }

(The component already calls it with the new signature.)

## Setup

    "db:migrate:document-category": "node scripts/migrate-document-category.js"
    npm run db:migrate:document-category

Then restart the dev server.

## Behaviour

- The dropdown sits beside the file picker and is REQUIRED — the Upload
  button stays disabled (with a tooltip) until both a file and a category
  are chosen; it resets after each successful upload.
- Server-side, the upload route rejects any category not in the fixed list
  (400), so the whitelist is enforced regardless of the UI.
- Each document row shows its category as a blue badge before the size.
- Pre-existing documents have category '' and simply show no badge.

## Renaming the values later

One place only: DOCUMENT_CATEGORIES in src/libs/documentConfig.ts. Dropdown,
server validation and badges all read from it.

⚠️ One caveat for that day: documents store the category STRING, so rows
uploaded as 'Value 1' keep saying 'Value 1' after you rename the option to
e.g. 'Correspondence'. If you upload real documents before the names are
confirmed, plan a one-off UPDATE, e.g.

    UPDATE contact_documents SET category = 'Correspondence'
    WHERE category = 'Value 1';

(or just treat pre-rename uploads as test data and clear them).
