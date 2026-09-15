/**
 * Migration: community homepage tables + one-to-one email group link.
 *
 * ⚠️  DESTRUCTIVE — per the "start fresh" decision, this DELETES all existing
 *     meeting groups (and their members/tags) before adding the NOT NULL
 *     community_id link. Take a backup if you're unsure.
 *
 * Run with: npm run db:migrate:community-pages
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

-- 1. Start fresh on email groups, then link each group to exactly one community
DELETE FROM meeting_groups;   -- cascades to members + tags

ALTER TABLE meeting_groups
  ADD COLUMN IF NOT EXISTS community_id UUID
    REFERENCES communities(community_id) ON DELETE CASCADE;

ALTER TABLE meeting_groups
  ALTER COLUMN community_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_meeting_groups_community
  ON meeting_groups (community_id);

-- 2. Community PoC — same pattern as contact_poc
CREATE TABLE IF NOT EXISTS community_poc (
  poc_id       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID         NOT NULL REFERENCES communities(community_id) ON DELETE CASCADE,
  username     VARCHAR(255) NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_community_poc UNIQUE (community_id, username)
);
CREATE INDEX IF NOT EXISTS idx_community_poc_username ON community_poc (username);

-- 3. Private notes — one per user per community
CREATE TABLE IF NOT EXISTS community_notes (
  note_id      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID         NOT NULL REFERENCES communities(community_id) ON DELETE CASCADE,
  username     VARCHAR(255) NOT NULL,
  comment      TEXT         NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_community_note_user UNIQUE (community_id, username)
);

-- 4. Headlines — shared notes readable by everyone
CREATE TABLE IF NOT EXISTS community_headlines (
  headline_id  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID         NOT NULL REFERENCES communities(community_id) ON DELETE CASCADE,
  username     VARCHAR(255) NOT NULL,
  title        VARCHAR(255) NOT NULL,
  body         TEXT         NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_community_headlines_community
  ON community_headlines (community_id, created_at DESC);

-- updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_community_notes_updated ON community_notes;
CREATE TRIGGER trg_community_notes_updated
  BEFORE UPDATE ON community_notes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_community_headlines_updated ON community_headlines;
CREATE TRIGGER trg_community_headlines_updated
  BEFORE UPDATE ON community_headlines FOR EACH ROW EXECUTE FUNCTION set_updated_at();
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running community pages migration (deletes existing meeting groups)...');
    await client.query(SQL);
    console.log('✅ community_poc, community_notes, community_headlines ready; meeting_groups linked to communities.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
