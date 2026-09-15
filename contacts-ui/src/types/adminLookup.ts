// Normalised shape shared by all three lookup tables in the admin UI.
// (DB columns differ: tags.tag / areas.area / teams.team_name all map to `name`.)
export interface AdminLookupItem {
  id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
  // Teams only:
  intranetUrl?: string;
}

export type LookupKind = 'tags' | 'areas' | 'teams';
