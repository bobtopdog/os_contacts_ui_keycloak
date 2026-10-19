/**
 * Migration: outcome lookup tables + optional outcome columns on the four
 * contact anex tables.
 * Run with: npm run db:migrate:outcomes   (then npm run db:seed:outcomes)
 *
 * Integrity is enforced in the database, not just the UI:
 *  - a sub-outcome cannot be set without an outcome (CHECK)
 *  - a sub-outcome must belong to the chosen outcome (composite FK)
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

// The four tables that get the outcome columns.
// ⚠️ Adjust if your anex notes table is named differently.
const TARGET_TABLES = [
  'contact_anex_notes',
  'contact_links',
  'contact_meetings',
  'contact_documents',
];

const LOOKUP_SQL = `
CREATE TABLE IF NOT EXISTS outcomes (
  outcome_id  SERIAL       PRIMARY KEY,
  code        VARCHAR(50)  NOT NULL UNIQUE,
  label       VARCHAR(255) NOT NULL,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  active      BOOLEAN      NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS sub_outcomes (
  sub_outcome_id SERIAL       PRIMARY KEY,
  outcome_id     INTEGER      NOT NULL REFERENCES outcomes(outcome_id),
  code           VARCHAR(50)  NOT NULL UNIQUE,
  label          VARCHAR(255) NOT NULL,
  sort_order     INTEGER      NOT NULL DEFAULT 0,
  active         BOOLEAN      NOT NULL DEFAULT true,
  -- Needed so the anex tables can FK on (sub_outcome_id, outcome_id)
  CONSTRAINT uq_sub_outcome_parent UNIQUE (sub_outcome_id, outcome_id)
);

CREATE INDEX IF NOT EXISTS idx_sub_outcomes_outcome ON sub_outcomes (outcome_id);
`;

function columnsSql(table) {
  return `
ALTER TABLE ${table}
  ADD COLUMN IF NOT EXISTS outcome_id     INTEGER REFERENCES outcomes(outcome_id),
  ADD COLUMN IF NOT EXISTS sub_outcome_id INTEGER;

DO $$ BEGIN
  ALTER TABLE ${table}
    ADD CONSTRAINT chk_${table}_sub_needs_outcome
    CHECK (sub_outcome_id IS NULL OR outcome_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- MATCH SIMPLE (the default): only checked when sub_outcome_id is set
DO $$ BEGIN
  ALTER TABLE ${table}
    ADD CONSTRAINT fk_${table}_sub_outcome
    FOREIGN KEY (sub_outcome_id, outcome_id)
    REFERENCES sub_outcomes (sub_outcome_id, outcome_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`;
}

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Creating outcome lookup tables...');
    await client.query(LOOKUP_SQL);
    for (const table of TARGET_TABLES) {
      console.log(`Adding outcome columns to ${table}...`);
      await client.query(columnsSql(table));
    }
    await client.query('COMMIT');
    console.log('✅ Outcome tables and columns ready. Now run the seed script.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed (rolled back):', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
