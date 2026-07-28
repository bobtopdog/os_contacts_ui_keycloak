/**
 * Migration: creates community_meeting_tags — links contact meetings to communities.
 * Run with: npm run db:migrate:community-meeting-tags
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

CREATE TABLE IF NOT EXISTS community_meeting_tags (
  tag_id       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID         NOT NULL REFERENCES communities(community_id) ON DELETE CASCADE,
  meeting_id   UUID         NOT NULL REFERENCES contact_meetings(meeting_id) ON DELETE CASCADE,
  tagged_by    VARCHAR(255) NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_community_meeting UNIQUE (community_id, meeting_id)
);

CREATE INDEX IF NOT EXISTS idx_cmt_meeting_id   ON community_meeting_tags (meeting_id);
CREATE INDEX IF NOT EXISTS idx_cmt_community_id ON community_meeting_tags (community_id);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running community_meeting_tags migration...');
    await client.query(SQL);
    console.log('✅ community_meeting_tags table ready.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
