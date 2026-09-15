import { notesQuery } from './notesDb';
import type { AdminLookupItem, LookupKind } from '@/types/adminLookup';

// Per-table column mapping: DB name column differs per table.
const TABLES: Record<LookupKind, { table: string; id: string; name: string; hasUrl: boolean }> = {
  tags:  { table: 'tags',  id: 'id',      name: 'tag',       hasUrl: false },
  areas: { table: 'areas', id: 'id',      name: 'area',      hasUrl: false },
  teams: { table: 'teams', id: 'team_id', name: 'team_name', hasUrl: true },
};

interface Row {
  id: string;
  name: string;
  description: string;
  active: boolean;
  created_at: Date;
  intranet_url?: string;
}

function toItem(row: Row): AdminLookupItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    active: row.active,
    createdAt: row.created_at?.toISOString?.() ?? new Date(0).toISOString(),
    ...(row.intranet_url !== undefined ? { intranetUrl: row.intranet_url ?? '' } : {}),
  };
}

// List ALL rows (admin sees inactive too), name order
export async function listLookup(kind: LookupKind): Promise<AdminLookupItem[]> {
  const t = TABLES[kind];
  const urlCol = t.hasUrl ? ', intranet_url' : '';
  const rows = await notesQuery<Row>(
    `SELECT ${t.id} AS id, ${t.name} AS name, description, active, created_at${urlCol}
     FROM ${t.table}
     ORDER BY ${t.name} ASC`
  );
  return rows.map(toItem);
}

// List active-only (for the read-only reference listing)
export async function listActiveLookup(kind: LookupKind): Promise<AdminLookupItem[]> {
  const t = TABLES[kind];
  const rows = await notesQuery<Row>(
    `SELECT ${t.id} AS id, ${t.name} AS name, description, active, created_at
     FROM ${t.table}
     WHERE active = true
     ORDER BY ${t.name} ASC`
  );
  return rows.map(toItem);
}

export async function createLookup(
  kind: LookupKind,
  name: string,
  description: string,
  intranetUrl?: string
): Promise<AdminLookupItem> {
  const t = TABLES[kind];
  const rows = t.hasUrl
    ? await notesQuery<Row>(
        `INSERT INTO ${t.table} (${t.name}, description, intranet_url)
         VALUES ($1, $2, $3)
         RETURNING ${t.id} AS id, ${t.name} AS name, description, active, created_at, intranet_url`,
        [name, description, intranetUrl ?? '']
      )
    : await notesQuery<Row>(
        `INSERT INTO ${t.table} (${t.name}, description)
         VALUES ($1, $2)
         RETURNING ${t.id} AS id, ${t.name} AS name, description, active, created_at`,
        [name, description]
      );
  return toItem(rows[0]);
}

export async function updateLookup(
  kind: LookupKind,
  id: string,
  name: string,
  description: string,
  active: boolean,
  intranetUrl?: string
): Promise<AdminLookupItem | null> {
  const t = TABLES[kind];
  const rows = t.hasUrl
    ? await notesQuery<Row>(
        `UPDATE ${t.table}
         SET ${t.name} = $1, description = $2, active = $3, intranet_url = $4
         WHERE ${t.id} = $5
         RETURNING ${t.id} AS id, ${t.name} AS name, description, active, created_at, intranet_url`,
        [name, description, active, intranetUrl ?? '', id]
      )
    : await notesQuery<Row>(
        `UPDATE ${t.table}
         SET ${t.name} = $1, description = $2, active = $3
         WHERE ${t.id} = $4
         RETURNING ${t.id} AS id, ${t.name} AS name, description, active, created_at`,
        [name, description, active, id]
      );
  return rows.length ? toItem(rows[0]) : null;
}
