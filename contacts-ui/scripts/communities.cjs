/**
 * Migration: creates communities, community_members, and community_contact_tags tables.
 * Run with: npm run db:migrate:communities
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

-- A community is owned by one user (the creator)
CREATE TABLE IF NOT EXISTS communities (
  community_id   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(255) NOT NULL,
  description    TEXT         NOT NULL DEFAULT '',
  created_by     VARCHAR(255) NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communities_created_by ON communities (created_by);

-- Community members (the creator is automatically added on creation)
CREATE TABLE IF NOT EXISTS community_members (
  member_id     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id  UUID         NOT NULL REFERENCES communities(community_id) ON DELETE CASCADE,
  username      VARCHAR(255) NOT NULL,
  added_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_community_user UNIQUE (community_id, username)
);

CREATE INDEX IF NOT EXISTS idx_community_members_username     ON community_members (username);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members (community_id);

-- Tags attaching a community to a contact (multiple allowed)
CREATE TABLE IF NOT EXISTS community_contact_tags (
  tag_id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id   UUID         NOT NULL REFERENCES communities(community_id) ON DELETE CASCADE,
  contact_id     UUID         NOT NULL,
  tagged_by      VARCHAR(255) NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tags_contact_id   ON community_contact_tags (contact_id);
CREATE INDEX IF NOT EXISTS idx_tags_community_id ON community_contact_tags (community_id);
CREATE INDEX IF NOT EXISTS idx_tags_tagged_by    ON community_contact_tags (tagged_by);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running communities migration...');
    await client.query(SQL);
    console.log('✅ communities, community_members and community_contact_tags tables ready.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
