/**
 * Migration: adds category column to contact_documents.
 * Run with: npm run db:migrate:document-category
 */
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

const pool = new Pool(
  process.env.NOTES_DATABASE_URL
    ? { connectionString: process.env.NOTES_DATABASE_URL }
    : {
        host: process.env.NOTES_PGHOST ?? 'localhost',
        port: parseInt(process.env.NOTES_PGPORT ?? '5432', 10),
        database: process.env.NOTES_PGDATABASE ?? 'contacts_notes_db',
        user: process.env.NOTES_PGUSER,
        password: process.env.NOTES_PGPASSWORD,
      }
);

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Adding category column to contact_documents...');
    await client.query(
      `ALTER TABLE contact_documents
       ADD COLUMN IF NOT EXISTS category VARCHAR(100) NOT NULL DEFAULT ''`
    );
    console.log('✅ category column added. Existing documents have an empty category.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
