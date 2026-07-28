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
 

async function migrate() { 
  const client = await pool.connect(); 
  try { 
    console.log('Adding title column to contact_meetings...'); 
    await client.query( 
      `ALTER TABLE contact_meetings 
       ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT ''` 
    ); 
    console.log('✅ title column added.'); 
  } catch (err) { 
    console.error('❌ Migration failed:', err); 
    process.exit(1); 
  } finally { 
    client.release(); 
    await pool.end(); 
  } 
} 
 

migrate();