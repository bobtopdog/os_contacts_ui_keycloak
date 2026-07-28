/**
 * Migration: creates the minister_meetings table in the notes database.
 * Run with: npm run db:migrate:minister-meetings
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

CREATE TABLE IF NOT EXISTS minister_meetings (
  meeting_id    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  minister_id   INTEGER      NOT NULL,
  username      VARCHAR(255) NOT NULL,
  meeting_date  DATE         NOT NULL,
  title         VARCHAR(255) NOT NULL,
  comments      TEXT         NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_minister_meetings_minister_id  ON minister_meetings (minister_id);
CREATE INDEX IF NOT EXISTS idx_minister_meetings_meeting_date ON minister_meetings (meeting_date DESC);

CREATE OR REPLACE FUNCTION update_minister_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_minister_meetings_updated_at ON minister_meetings;
CREATE TRIGGER set_minister_meetings_updated_at
  BEFORE UPDATE ON minister_meetings
  FOR EACH ROW EXECUTE FUNCTION update_minister_meetings_updated_at();
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running minister_meetings migration...');
    await client.query(SQL);
    console.log('✅ minister_meetings table ready.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();