import { notesQuery } from './notesDb';
import type { MinisterMeeting } from '@/types/minister';

interface MeetingRow {
  meeting_id: string;
  minister_id: number;
  username: string;
  meeting_date: Date;
  title: string;
  comments: string;
  created_at: Date;
  updated_at: Date;
}

function toMeeting(row: MeetingRow): MinisterMeeting {
  return {
    meetingId: row.meeting_id,
    ministerId: row.minister_id,
    username: row.username,
    meetingDate: row.meeting_date.toISOString().split('T')[0], // YYYY-MM-DD
    title: row.title,
    comments: row.comments,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

// Fetch all meetings for a minister, newest first
export async function getMinisterMeetings(ministerId: number): Promise<MinisterMeeting[]> {
  const rows = await notesQuery<MeetingRow>(
    `SELECT meeting_id, minister_id, username, meeting_date, title, comments,
            created_at, updated_at
     FROM minister_meetings
     WHERE minister_id = $1
     ORDER BY meeting_date DESC, created_at DESC`,
    [ministerId]
  );
  return rows.map(toMeeting);
}

// Create a new meeting
export async function createMinisterMeeting(
  ministerId: number,
  username: string,
  meetingDate: string,
  title: string,
  comments: string
): Promise<MinisterMeeting> {
  const rows = await notesQuery<MeetingRow>(
    `INSERT INTO minister_meetings (minister_id, username, meeting_date, title, comments)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING meeting_id, minister_id, username, meeting_date, title, comments,
               created_at, updated_at`,
    [ministerId, username, meetingDate, title, comments]
  );
  return toMeeting(rows[0]);
}

// Update a meeting — owner check enforced at DB level
export async function updateMinisterMeeting(
  meetingId: string,
  username: string,
  meetingDate: string,
  title: string,
  comments: string
): Promise<MinisterMeeting | null> {
  const rows = await notesQuery<MeetingRow>(
    `UPDATE minister_meetings
     SET meeting_date = $1, title = $2, comments = $3
     WHERE meeting_id = $4 AND username = $5
     RETURNING meeting_id, minister_id, username, meeting_date, title, comments,
               created_at, updated_at`,
    [meetingDate, title, comments, meetingId, username]
  );
  return rows.length ? toMeeting(rows[0]) : null;
}

// Delete a meeting — owner check enforced at DB level
export async function deleteMinisterMeeting(
  meetingId: string,
  username: string
): Promise<boolean> {
  const rows = await notesQuery<{ meeting_id: string }>(
    `DELETE FROM minister_meetings
     WHERE meeting_id = $1 AND username = $2
     RETURNING meeting_id`,
    [meetingId, username]
  );
  return rows.length > 0;
}
