export interface ContactSummary {
  personId: string;
  fullName: string;
  organisation: string;
  role: string;
  email: string;
  workPhone: string;
  homePhone: string;
}

export interface ContactDetail extends ContactSummary {
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ContactNote {
  noteId: string;
  contactId: string;
  username: string;
  comment: string;
  createdAt: string;
}

export interface ContactPoc{
  pocId: string;
  contactId: string;
  username: string;
  details: string;
  createdAt: string;
}

export interface ContactTag{
  tagId: string;
  contactId: string;
  username: string;
  tag: string;
  createdAt: string;
}

export interface ContactLink {
  linkId: string;
  contactId: string;
  username: string;
  reference: string;
  label: string;
  createdAt: string;
  updatedAt: string;
}


export interface MeetingLink {
  meetingLinkId: string;
  meetingId: string;
  reference: string;
  createdAt: string;
}

export interface ContactMeeting {
  meetingId: string;
  contactId: string;
  username: string;
  meetingDate: string;
  title: string;
  notes: string;
  score1: number;
  score2: number;
  score3: number;
  score4: number;
  links: MeetingLink[];
  createdAt: string;
  updatedAt: string;
}

export interface MyContactMeeting {
  meetingId: string;
  contactId: string;
  username: string;
  meetingDate: string;
  title: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
export interface ContactDocument {
  documentId: string;
  contactId: string;
  username: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}
export interface ContactAnexNote {
  noteId: string;
  contactId: string;
  username: string;
  comment: string;
  createdAt: string;
}

export interface Team {
  teamId: string;
  teamName: string;
}

export interface UserTeam {
  userTeamId: string;
  username: string;
  teamId: string;
  teamName: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface TeamDetail {
  teamId: string;
  teamName: string;
  description: string;
  intranetUrl: string;
  updatedAt: string;
}

export interface TeamMember {
  userTeamId: string;
  username: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface Tags {
  Id: string;
  tag: string;
}


export interface ContactHighlights {
  source: string;
  value: string;
  created_at: string;
}

export interface Areas {
  Id: string;
  area: string;
}

export interface ContactArea{
  areaId: string;
  contactId: string;
  username: string;
  area: string;
  createdAt: string;
}

export interface ContactHighlightNote {
  noteId: string;
  contactId: string;
  username: string;
  comment: string;
  createdAt: string;
}
