import { notesQuery } from './notesDb';
import type { ContactMeeting, MeetingLink } from '@/types/contact';

interface MeetingRow {
  meeting_id: string;
  contact_id: string;
  username: string;
  meeting_date: Date;
  notes: string;
  score1: number;
  score2: number;
  score3: number;
  score4: number;
  created_at: Date;
  updated_at: Date;
}

interface MeetingLinkRow {
  meeting_link_id: string;
  meeting_id: string;
  reference: string;
  created_at: Date;
}

function toMeetingLink(row: MeetingLinkRow): MeetingLink {
  return {
    meetingLinkId: row.meeting_link_id,
    meetingId: row.meeting_id,
    reference: row.reference,
    createdAt: row.created_at.toISOString(),
  };
}

function toMeeting(row: MeetingRow, links: MeetingLink[] = []): ContactMeeting {
  return {
    meetingId: row.meeting_id,
    contactId: row.contact_id,
    username: row.username,
    meetingDate: row.meeting_date.toISOString().split('T')[0], // YYYY-MM-DD
    notes: row.notes,
    score1: row.score1,
    score2: row.score2,
    score3: row.score3,
    score4: row.score4,
    links,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

// Fetch all meetings for a contact with their links, newest meeting date first
export async function getMeetingsByContactId(contactId: string): Promise<ContactMeeting[]> {
  const meetingRows = await notesQuery<MeetingRow>(
    `SELECT meeting_id, contact_id, username, meeting_date, notes,
            score1, score2, score3, score4, created_at, updated_at
     FROM contact_meetings
     WHERE contact_id = $1
     ORDER BY meeting_date DESC, created_at DESC`,
    [contactId]
  );

  if (meetingRows.length === 0) return [];

  // Fetch all links for these meetings in one query
  const meetingIds = meetingRows.map((r) => r.meeting_id);
  const linkRows = await notesQuery<MeetingLinkRow>(
    `SELECT meeting_link_id, meeting_id, reference, created_at
     FROM contact_meeting_links
     WHERE meeting_id = ANY($1)
     ORDER BY created_at ASC`,
    [meetingIds]
  );

  // Group links by meeting_id
  const linksByMeeting = linkRows.reduce<Record<string, MeetingLink[]>>((acc, row) => {
    const link = toMeetingLink(row);
    if (!acc[row.meeting_id]) acc[row.meeting_id] = [];
    acc[row.meeting_id].push(link);
    return acc;
  }, {});

  return meetingRows.map((r) => toMeeting(r, linksByMeeting[r.meeting_id] ?? []));
}

// Create a new meeting record
export async function createMeeting(
  contactId: string,
  username: string,
  meetingDate: string,
  notes: string,
  score1: number,
  score2: number,
  score3: number,
  score4: number
): Promise<ContactMeeting> {
  const rows = await notesQuery<MeetingRow>(
    `INSERT INTO contact_meetings
       (contact_id, username, meeting_date, notes, score1, score2, score3, score4)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING meeting_id, contact_id, username, meeting_date, notes,
               score1, score2, score3, score4, created_at, updated_at`,
    [contactId, username, meetingDate, notes, score1, score2, score3, score4]
  );
  return toMeeting(rows[0], []);
}

// Update a meeting — owner check enforced at DB level
export async function updateMeeting(
  meetingId: string,
  username: string,
  meetingDate: string,
  notes: string,
  score1: number,
  score2: number,
  score3: number,
  score4: number
): Promise<ContactMeeting | null> {
  const rows = await notesQuery<MeetingRow>(
    `UPDATE contact_meetings
     SET meeting_date = $1, notes = $2,
         score1 = $3, score2 = $4, score3 = $5, score4 = $6
     WHERE meeting_id = $7 AND username = $8
     RETURNING meeting_id, contact_id, username, meeting_date, notes,
               score1, score2, score3, score4, created_at, updated_at`,
    [meetingDate, notes, score1, score2, score3, score4, meetingId, username]
  );
  if (!rows.length) return null;

  // Re-fetch links for the updated meeting
  const linkRows = await notesQuery<MeetingLinkRow>(
    `SELECT meeting_link_id, meeting_id, reference, created_at
     FROM contact_meeting_links WHERE meeting_id = $1 ORDER BY created_at ASC`,
    [meetingId]
  );
  return toMeeting(rows[0], linkRows.map(toMeetingLink));
}

// Delete a meeting — owner check enforced at DB level (cascade deletes links)
export async function deleteMeeting(
  meetingId: string,
  username: string
): Promise<boolean> {
  const rows = await notesQuery<{ meeting_id: string }>(
    `DELETE FROM contact_meetings
     WHERE meeting_id = $1 AND username = $2
     RETURNING meeting_id`,
    [meetingId, username]
  );
  return rows.length > 0;
}

// Add a document link to a meeting
export async function addMeetingLink(
  meetingId: string,
  reference: string
): Promise<MeetingLink> {
  const rows = await notesQuery<MeetingLinkRow>(
    `INSERT INTO contact_meeting_links (meeting_id, reference)
     VALUES ($1, $2)
     RETURNING meeting_link_id, meeting_id, reference, created_at`,
    [meetingId, reference]
  );
  return toMeetingLink(rows[0]);
}

// Delete a meeting link
export async function deleteMeetingLink(
  meetingLinkId: string
): Promise<boolean> {
  const rows = await notesQuery<{ meeting_link_id: string }>(
    `DELETE FROM contact_meeting_links
     WHERE meeting_link_id = $1
     RETURNING meeting_link_id`,
    [meetingLinkId]
  );
  return rows.length > 0;
}
