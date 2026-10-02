export interface CommunityCardData {
  communityId: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  isCreator: boolean;
  isMember: boolean;
}

export interface CommunityDetail extends CommunityCardData {
  groupId: string | null;      // the linked email group (always set for new communities)
  groupName: string | null;
}

export interface CommunityPoc {
  pocId: string;
  communityId: string;
  username: string;
  createdAt: string;
}

export interface CommunityNote {
  noteId: string;
  communityId: string;
  username: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityHeadline {
  headlineId: string;
  communityId: string;
  username: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMeeting {
  meetingId: string;
  contactId: string;
  meetingDate: string;   // YYYY-MM-DD
  title: string;
  username: string;
}
