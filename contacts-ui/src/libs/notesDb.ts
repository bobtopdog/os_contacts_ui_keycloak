import { Pool } from 'pg';

// Separate pool for the notes database — completely independent of contacts
let notesPool: Pool | null = null;

export function getNotesPool(): Pool {
  if (!notesPool) {
    notesPool = new Pool(
      process.env.NOTES_DATABASE_URL
        ? {
            connectionString: process.env.NOTES_DATABASE_URL,
            max: 50,  
            min: 2,              // Maximum connections in pool
            idleTimeoutMillis: 60000,
            connectionTimeoutMillis: 60000,
            allowExitOnIdle: false,
            ssl: false,
              /* process.env.NODE_ENV === 'production'
                ? { rejectUnauthorized: false }
                : false, */
          }
        : {
            //connectionString: process.env.NOTES_DATABASE_URL,
            
            host: process.env.NOTES_PGHOST ?? '127.0.0.1',
            port: parseInt(process.env.NOTES_PGPORT ?? '5432', 10),
            database: process.env.NOTES_PGDATABASE ?? 'opus_storm',
            user: process.env.NOTES_PGUSER,
            password: process.env.NOTES_PGPASSWORD,
            max: 50, 
            min: 2,               // Maximum connections in pool
            idleTimeoutMillis: 60000,
            connectionTimeoutMillis: 60000,
            allowExitOnIdle: false,
            
            ssl: false,
              /* process.env.NODE_ENV === 'production'
                ? { rejectUnauthorized: false }
                : false,  */
          },
        
    );

    notesPool.on('error', (err) => {
      console.error('Unexpected notes DB pool error:', err);
    });

  }
  return notesPool;
}

export async function notesQuery<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  let client;

  try {
    client = await getNotesPool().connect();
    const result = await client.query(text, params);
    return result.rows as T[];
  } catch (err) {
    console.error('notesQuery error: ', {text, error: err});
    throw err;
  } finally {
    if (client) client.release();
  }
}
