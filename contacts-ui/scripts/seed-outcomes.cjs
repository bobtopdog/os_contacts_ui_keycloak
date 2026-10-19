/**
 * Seed / update outcome values.  Run with: npm run db:seed:outcomes
 *
 * ✏️  EDIT THE OUTCOMES ARRAY BELOW, then re-run. Safe to run repeatedly:
 *    - matched on `code`, so labels/order can be changed and re-seeded
 *    - anything NOT listed here is set active=false (hidden from dropdowns)
 *      rather than deleted, so records already using it stay intact
 *
 * Codes are the stable identifiers — once real data uses a code, change its
 * label freely but don't change the code itself.
 */
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const OUTCOMES = [
  {
    code: 'Fo1', label: 'Fo1',
    subs: [
      { code: 'Fo1a', label: 'Fo1a' },
      { code: 'Fo1b', label: 'Fo1b' },
      { code: 'Fo1c', label: 'Fo1c' },
    ],
  },
  {
    code: 'Fo2', label: 'Fo2',
    subs: [
      { code: 'Fo2a', label: 'Fo2a' },
      { code: 'Fo2b', label: 'Fo2b' },
      { code: 'Fo2c', label: 'Fo2c' },
    ],
  },
  {
    code: 'Fo3', label: 'Fo3',
    subs: [
      { code: 'Fo3a', label: 'Fo3a' },
      { code: 'Fo3b', label: 'Fo3b' },
      { code: 'Fo3c', label: 'Fo3c' },
    ],
  },
  {
    code: 'Fo4', label: 'Fo4',
    subs: [
      { code: 'Fo4a', label: 'Fo4a' },
      { code: 'Fo4b', label: 'Fo4b' },
      { code: 'Fo4c', label: 'Fo4c' },
    ],
  },
];

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

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const outcomeCodes = [];
    const subCodes = [];

    for (const [i, o] of OUTCOMES.entries()) {
      const { rows } = await client.query(
        `INSERT INTO outcomes (code, label, sort_order, active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (code) DO UPDATE
           SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, active = true
         RETURNING outcome_id`,
        [o.code, o.label, i]
      );
      const outcomeId = rows[0].outcome_id;
      outcomeCodes.push(o.code);

      for (const [j, s] of (o.subs ?? []).entries()) {
        await client.query(
          `INSERT INTO sub_outcomes (outcome_id, code, label, sort_order, active)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT (code) DO UPDATE
             SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, active = true`,
          [outcomeId, s.code, s.label, j]
        );
        subCodes.push(s.code);
      }
    }

    // Deactivate anything no longer listed (never delete — history depends on it)
    const o = await client.query(
      `UPDATE outcomes SET active = false WHERE code <> ALL($1) AND active RETURNING code`,
      [outcomeCodes]
    );
    const s = await client.query(
      `UPDATE sub_outcomes SET active = false WHERE code <> ALL($1) AND active RETURNING code`,
      [subCodes]
    );

    await client.query('COMMIT');
    console.log(`✅ Seeded ${outcomeCodes.length} outcomes, ${subCodes.length} sub-outcomes.`);
    if (o.rowCount || s.rowCount) {
      console.log('   Deactivated:', [...o.rows, ...s.rows].map((r) => r.code).join(', '));
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed (rolled back):', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
