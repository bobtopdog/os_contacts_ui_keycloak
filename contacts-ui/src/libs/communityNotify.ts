import nodemailer from 'nodemailer';
import { getCommunityGroupMembers } from './communityPagesRepository';

/**
 * Emails a community's linked email-group members when a meeting is tagged
 * with that community. Self-contained (same SMTP env vars as email.ts) so it
 * compiles regardless of how your existing helper is named — swap the
 * `send` function for your email.ts equivalent if you'd rather share one.
 *
 * Fire-and-forget: never throws, never blocks the API response.
 */

const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN ?? 'example.com';
const SMTP_HOST = process.env.SMTP_HOST;

function toAddress(username: string) {
  return `${username}@${EMAIL_DOMAIN}`;
}

async function send(to: string[], subject: string, text: string) {
  if (!SMTP_HOST) {
    console.log(`[email stub] To: ${to.join(', ')}\nSubject: ${subject}\n${text}`);
    return;
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '25', 10),
    secure: process.env.SMTP_SECURE === 'true',
    ...(process.env.SMTP_USER
      ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } }
      : {}),
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `noreply@${EMAIL_DOMAIN}`,
    to: to.join(', '),
    subject,
    text,
  });
}

export function notifyCommunityGroupOfMeeting(opts: {
  communityId: string;
  communityName: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  taggedBy: string;
  contactId: string;
}): void {
  (async () => {
    try {
      const group = await getCommunityGroupMembers(opts.communityId);
      if (!group || group.usernames.length === 0) return;

      const appUrl = process.env.NEXTAUTH_URL ?? '';
      await send(
        group.usernames.map(toAddress),
        `[${opts.communityName}] Meeting tagged: ${opts.meetingTitle || 'Untitled meeting'}`,
        [
          `${opts.taggedBy} tagged a meeting with the ${opts.communityName} community.`,
          '',
          `Meeting: ${opts.meetingTitle || '(no title)'}`,
          `Date: ${opts.meetingDate}`,
          appUrl ? `View contact: ${appUrl}/contacts/${opts.contactId}` : '',
          '',
          `You are receiving this as a member of the "${group.groupName}" email group.`,
        ].join('\n')
      );
    } catch (err) {
      console.error('Community meeting notification failed:', err);
    }
  })();
}
