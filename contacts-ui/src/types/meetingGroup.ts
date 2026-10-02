export type GroupRole = 'admin' | 'viewer';

export interface MeetingGroup {
  groupId: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  isCreator: boolean;
  myRole: GroupRole;
}

export interface MeetingGroupMember {
  groupMemberId: string;
  memberId: string
  groupId: string;
  username: string;
  role: GroupRole;
  addedAt: string;
}

export interface MeetingGroupTag {
  tagId: string;
  groupId: string;
  groupName: string;
  meetingId: string;
  taggedBy: string;
  createdAt: string;
}
