/**
 * Migration: creates the contact_notes table in the notes database.
 * Run with: npm run db:migrate:notes
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

const SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS contact_notes (
  note_id      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id   UUID         NOT NULL,
  username     VARCHAR(255) NOT NULL,
  comment      TEXT         NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_contact_id ON contact_notes (contact_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON contact_notes (created_at DESC);

CREATE TABLE IF NOT EXISTS contact_poc (
  poc_id      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id   UUID         NOT NULL,
  username     VARCHAR(255) NOT NULL,
  details      VARCHAR(255)         NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poc_contact_id ON contact_poc (contact_id);
CREATE INDEX IF NOT EXISTS idx_poc_created_at ON contact_poc (created_at DESC);

CREATE TABLE IF NOT EXISTS contact_tag (
  tag_id      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id   UUID         NOT NULL,
  username     VARCHAR(255) NOT NULL,
  tag      VARCHAR(255)         NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tagx_contact_id ON contact_tag (contact_id);
CREATE INDEX IF NOT EXISTS idx_tagx_created_at ON contact_tag (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tagx_tag ON contact_tag (tag);

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS contact_links (
  link_id      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id   UUID         NOT NULL,
  username     VARCHAR(255) NOT NULL,
  reference    VARCHAR(255) NOT NULL,
  label        VARCHAR(255) NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_links_contact_id ON contact_links (contact_id);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON contact_links (created_at DESC);

`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running contact_notes migration on notes database...');
    await client.query(SQL);
    console.log('✅ contact_notes table ready.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
