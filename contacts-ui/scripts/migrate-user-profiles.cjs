/**
 * Migration: creates user_profiles (about-me text per username).
 * Run with: npm run db:migrate:user-profiles
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
CREATE TABLE IF NOT EXISTS user_profiles (
  username    VARCHAR(255) PRIMARY KEY,
  about_me    TEXT         NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Creating user_profiles...');
    await client.query(SQL);
    console.log('✅ user_profiles ready.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}
migrate();
