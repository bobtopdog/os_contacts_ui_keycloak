import { getNotesPool } from './notesDb'; 
 

export async function warmupNotesPool(): Promise<void> { 
  try { 
    console.log('Warming up notes DB pool...'); 
    const client = await getNotesPool().connect(); 
    await client.query('SELECT 1'); 
    client.release(); 
    console.log('✅ Notes DB pool warmed up'); 
  } catch (err) { 
    console.error(' Notes DB warmup failed:', err); 
  } 
} 
