export interface RecentActivityItem {
  id: string;
  contactId: string;
  label: string;        // note excerpt / meeting title / filename
  createdAt: string;
}

export interface UserSummary {
  username: string;
  aboutMe: string;
  pocContactIds: string[];
  recent: {
    note: RecentActivityItem | null;
    meeting: RecentActivityItem | null;
    document: RecentActivityItem | null;
  };
}
