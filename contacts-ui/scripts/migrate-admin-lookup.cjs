/**
 * Migration: adds description + active to tags & areas, and active to teams.
 * Run with: npm run db:migrate:admin-lookup
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
ALTER TABLE tags
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE areas
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Adding description/active columns to tags, areas, teams...');
    await client.query(SQL);
    console.log('✅ Columns added. Existing rows default to active=true.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
