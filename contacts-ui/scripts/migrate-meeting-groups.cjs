/**
 * Migration: creates meeting_groups, meeting_group_members and
 * meeting_group_tags tables.
 * Run with: npm run db:migrate:meeting-groups
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

-- Meeting groups
CREATE TABLE IF NOT EXISTS meeting_groups (
  group_id    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  created_by  VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_groups_created_by ON meeting_groups (created_by);

-- Group members with a role: 'admin' can manage members, 'viewer' has view access
CREATE TABLE IF NOT EXISTS meeting_group_members (
  group_member_id UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID         NOT NULL REFERENCES meeting_groups(group_id) ON DELETE CASCADE,
  username        VARCHAR(255) NOT NULL,
  role            VARCHAR(10)  NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  added_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_group_member UNIQUE (group_id, username)
);

CREATE INDEX IF NOT EXISTS idx_group_members_username ON meeting_group_members (username);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON meeting_group_members (group_id);

-- Tags attaching a group to a contact meeting
CREATE TABLE IF NOT EXISTS meeting_group_tags (
  tag_id      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID         NOT NULL REFERENCES meeting_groups(group_id) ON DELETE CASCADE,
  meeting_id  UUID         NOT NULL,
  tagged_by   VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_tags_meeting_id ON meeting_group_tags (meeting_id);
CREATE INDEX IF NOT EXISTS idx_group_tags_group_id   ON meeting_group_tags (group_id);

-- Auto-update updated_at on meeting_groups
CREATE OR REPLACE FUNCTION update_meeting_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_meeting_groups_updated_at ON meeting_groups;
CREATE TRIGGER set_meeting_groups_updated_at
  BEFORE UPDATE ON meeting_groups
  FOR EACH ROW EXECUTE FUNCTION update_meeting_groups_updated_at();
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running meeting groups migration...');
    await client.query(SQL);
    console.log('✅ meeting_groups, meeting_group_members and meeting_group_tags ready.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
