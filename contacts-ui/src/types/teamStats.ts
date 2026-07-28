export interface MemberActivity {
  username: string;
  notes: number;
  clientMeetings: number;
  ministerMeetings: number;
  links: number;
  documents: number;
  total: number;
}

export interface RecentNote {
  noteId: string;
  contactId: string;
  username: string;
  comment: string;
  createdAt: string;
}

export interface TeamWeeklyStats {
  weekStart: string;                 // ISO date of Monday
  weekEnd: string;                   // ISO date of Sunday
  memberCount: number;
  clientMeetingsCount: number;       // contact_meetings recorded this week
  ministerMeetingsCount: number;     // minister_meetings recorded this week
  notesCount: number;                // contact_notes entered this week
  recentNotes: RecentNote[];         // latest few notes for the overview
  scoreTotals: {
    score1: number;
    score2: number;
    score3: number;
    score4: number;
  };
  memberActivity: MemberActivity[];
  recentClientMeetings: RecentClientMeeting[];
  recentMinisterMeetings: RecentMinisterMeeting[];
}

export interface RecentClientMeeting {
  meetingId: string;
  contactId: string;
  username: string;
  meetingDate: string;   // YYYY-MM-DD
  title: string;
}

export interface RecentMinisterMeeting {
  meetingId: string;
  ministerId: number;
  username: string;
  meetingDate: string;   // YYYY-MM-DD
  title: string;
}

