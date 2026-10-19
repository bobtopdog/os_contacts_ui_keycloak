/**
 * Migration: 3-step assessment columns on contact_meetings.
 * Run with: npm run db:migrate:meeting-assessment
 *
 * Existing meetings get an empty assessment. The step rules are also
 * enforced by CHECK constraints, so invalid combinations can't be stored.
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
ALTER TABLE contact_meetings
  ADD COLUMN IF NOT EXISTS assess_purposes    TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS assess_outcome     VARCHAR(50),
  ADD COLUMN IF NOT EXISTS assess_significant TEXT[] NOT NULL DEFAULT '{}';

-- Step 1: at most 2 purposes
DO $$ BEGIN
  ALTER TABLE contact_meetings ADD CONSTRAINT chk_assess_max_purposes
    CHECK (cardinality(assess_purposes) <= 2);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Step 2 requires Step 1
DO $$ BEGIN
  ALTER TABLE contact_meetings ADD CONSTRAINT chk_assess_outcome_needs_purpose
    CHECK (assess_outcome IS NULL OR cardinality(assess_purposes) > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Step 3 requires Step 2
DO $$ BEGIN
  ALTER TABLE contact_meetings ADD CONSTRAINT chk_assess_significant_needs_outcome
    CHECK (cardinality(assess_significant) = 0 OR assess_outcome IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Adding assessment columns to contact_meetings...');
    await client.query(SQL);
    console.log('✅ Meeting assessment columns ready.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
