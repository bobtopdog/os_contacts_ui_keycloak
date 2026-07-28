export interface MinisterNote {
  noteId: string;
  memberId?: number;
  username: string;
  comment: string;
  createdAt: string;
}
export interface MinisterMeeting {
  meetingId: string;
  ministerId: number;
  username: string;
  meetingDate: string;
  title: string;
  comments: string;
  createdAt: string;
  updatedAt: string;
}