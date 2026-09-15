import { notesQuery } from './notesDb';
import type { Tags } from '@/types/contact';

interface TagsRow {
  id: string;
  tag: string;
  created_at: Date;
}

function toTag(row: TagsRow): Tags{
  return { Id: row.id, tag: row.tag };
}

// All available teams for the dropdown
export async function getAllTags(): Promise<Tags[]> {
  const rows = await notesQuery<TagsRow>(
    `SELECT id, tag FROM tags WHERE active = true ORDER BY tag ASC`
  );
  return rows.map(toTag);
}
