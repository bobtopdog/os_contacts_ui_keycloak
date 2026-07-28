export interface Community {
  communityId: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  isCreator: boolean;
}

export interface CommunityMember {
  memberId: string;
  communityId: string;
  username: string;
  addedAt: string;
}

export interface CommunityTag {
  tagId: string;
  communityId: string;
  communityName: string;
  contactId: string;
  taggedBy: string;
  createdAt: string;
}

export interface MeetingCommunityTag {
  tagId: string;
  communityId: string;
  communityName: string;
  meetingId: string;
  taggedBy: string;
  createdAt: string;
 }