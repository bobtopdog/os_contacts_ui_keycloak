export interface NetworkNode {
  id: string;                 // 'team:<uuid>' or 'contact:<uuid>'
  entityId: string;
  label: string;
  type: 'team' | 'contact';
  mine?: boolean;             // team: user is a member / contact: user is PoC
  memberCount?: number;       // teams only
  organisation?: string;      // contacts only
}

export interface LinkBreakdown {
  notes: number;
  meetings: number;
  poc: number;
  documents: number;
  links: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  weight: number;
  breakdown: LinkBreakdown;
  lastActivity: string | null;   // ISO datetime of most recent interaction
}

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}
