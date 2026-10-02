import { notesQuery } from './notesDb';
import type { UserSummary, RecentActivityItem } from '@/types/userProfile';

export async function getAboutMe(username: string): Promise<string> {
  const rows = await notesQuery<{ about_me: string }>(
    `SELECT about_me FROM user_profiles WHERE username = $1`, [username]
  );
  return rows[0]?.about_me ?? '';
}

export async function upsertAboutMe(username: string, aboutMe: string): Promise<void> {
  await notesQuery(
    `INSERT INTO user_profiles (username, about_me) VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET about_me = EXCLUDED.about_me, updated_at = NOW()`,
    [username, aboutMe]
  );
}

/** Everything the summary modal needs, in parallel. */
export async function getUserSummary(username: string): Promise<UserSummary> {
  const [aboutMe, pocRows, noteRows, meetingRows, docRows] = await Promise.all([
    getAboutMe(username),
    notesQuery<{ contact_id: string }>(
      `SELECT contact_id FROM contact_poc WHERE username = $1 ORDER BY created_at DESC`, [username]
    ),
    notesQuery<{ note_id: string; contact_id: string; comment: string; created_at: Date }>(
      `SELECT note_id, contact_id, comment, created_at FROM contact_notes
       WHERE username = $1 ORDER BY created_at DESC LIMIT 1`, [username]
    ),
    notesQuery<{ meeting_id: string; contact_id: string; title: string | null; created_at: Date }>(
      `SELECT meeting_id, contact_id, title, created_at FROM contact_meetings
       WHERE username = $1 ORDER BY created_at DESC LIMIT 1`, [username]
    ),
    notesQuery<{ document_id: string; contact_id: string; filename: string; created_at: Date }>(
      `SELECT document_id, contact_id, filename, created_at FROM contact_documents
       WHERE username = $1 ORDER BY created_at DESC LIMIT 1`, [username]
    ),
  ]);

  const item = (id: string, contactId: string, label: string, at: Date): RecentActivityItem =>
    ({ id, contactId, label, createdAt: at.toISOString() });

  return {
    username,
    aboutMe,
    pocContactIds: pocRows.map((r) => r.contact_id),
    recent: {
      note: noteRows[0]
        ? item(noteRows[0].note_id, noteRows[0].contact_id,
               noteRows[0].comment.length > 80 ? `${noteRows[0].comment.slice(0, 80)}…` : noteRows[0].comment,
               noteRows[0].created_at)
        : null,
      meeting: meetingRows[0]
        ? item(meetingRows[0].meeting_id, meetingRows[0].contact_id, meetingRows[0].title ?? 'Meeting', meetingRows[0].created_at)
        : null,
      document: docRows[0]
        ? item(docRows[0].document_id, docRows[0].contact_id, docRows[0].filename, docRows[0].created_at)
        : null,
    },
  };
}
