import { notesQuery } from './notesDb';
import type { Areas } from '@/types/contact';

interface AreasRow {
  id: string;
  area: string;
  created_at: Date;
}

function toArea(row: AreasRow): Areas{
  return { Id: row.id, area: row.area };
}

// All available teams for the dropdown
export async function getAllAreas(): Promise<Areas[]> {
  const rows = await notesQuery<AreasRow>(
    `SELECT id, area FROM areas ORDER BY area ASC`
  );
  return rows.map(toArea);
}
