import nodemailer, { Transporter } from 'nodemailer';

// ---------------------------------------------------------------------------
// Email via corporate SMTP relay.
//
// Required env vars:
//   SMTP_HOST       e.g. smtp.company.com
//   SMTP_PORT       e.g. 25 or 587
//   SMTP_SECURE     'true' for TLS on connect (port 465), otherwise 'false'
//   SMTP_FROM       e.g. "Contacts App <noreply@company.com>"
//   EMAIL_DOMAIN    e.g. company.com  (emails derived as username@EMAIL_DOMAIN)
//
// Optional (only if the relay requires auth):
//   SMTP_USER, SMTP_PASSWORD
//
// If SMTP_HOST is not set, emails are logged to the console instead of sent —
// handy for local development.
// ---------------------------------------------------------------------------

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!process.env.SMTP_HOST) return null; // dev mode — log only

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '25', 10),
      secure: process.env.SMTP_SECURE === 'true',
      ...(process.env.SMTP_USER
        ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } }
        : {}),
    });
  }
  return transporter;
}

/** Derive an email address from a username using EMAIL_DOMAIN. */
export function usernameToEmail(username: string): string {
  const domain = process.env.EMAIL_DOMAIN ?? 'example.com';
  return `${username}@${domain}`;
}

/**
 * Send an email. Fire-and-forget friendly — never throws, logs failures.
 * In dev (no SMTP_HOST) it just logs the message.
 */
export async function sendEmail(
  toUsernames: string[],
  subject: string,
  textBody: string
): Promise<void> {
  if (toUsernames.length === 0) return;

  const to = toUsernames.map(usernameToEmail);
  const t = getTransporter();

  if (!t) {
    console.log('[email:dev] Would send:', { to, subject, textBody });
    return;
  }

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM ?? 'noreply@example.com',
      to: to.join(', '),
      subject,
      text: textBody,
    });
  } catch (err) {
    // Never let email failures break the API response
    console.error('[email] Failed to send:', { to, subject }, err);
  }
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

/** Alert group admins that the group changed (requirement 4). */
export function groupChangeAlert(
  adminUsernames: string[],
  groupName: string,
  changedBy: string,
  changeDescription: string
): Promise<void> {
  return sendEmail(
    adminUsernames,
    `[Contacts App] Group "${groupName}" updated`,
    `The meeting group "${groupName}" has been updated.\n\n` +
    `Change: ${changeDescription}\n` +
    `Made by: ${changedBy}\n\n` +
    `You are receiving this because you are an admin of this group.`
  );
}

/** Notify all group members that a meeting was tagged (requirement 5). */
export function meetingTaggedNotification(
  memberUsernames: string[],
  groupName: string,
  taggedBy: string,
  meetingId: string
): Promise<void> {
  const appUrl = process.env.NEXTAUTH_URL ?? '';
  return sendEmail(
    memberUsernames,
    `[Contacts App] New meeting tagged for group "${groupName}"`,
    `A contact meeting has been tagged for your group "${groupName}".\n\n` +
    `Tagged by: ${taggedBy}\n` +
    (appUrl ? `View in the app: ${appUrl}\n\n` : '\n') +
    `You are receiving this because you are a member of this group.`
  );
}
