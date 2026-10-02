'use client';

import { useDirectoryUser, displayName } from '@/hooks/useDirectoryUser';

/**
 * Renders a username as the person's real name ("John Smith"), falling back
 * to the username if the directory doesn't know them. Optionally shows the
 * username alongside: John Smith (smithj1).
 *
 * Drop-in anywhere you currently render {someone.username}.
 */
export default function UserDisplayName({
  username, showUsername = false,
}: { username: string; showUsername?: boolean }) {
  const { data } = useDirectoryUser(username);
  const name = displayName(data, username);
  const known = data?.found && name !== username;

  return (
    <span title={known ? username : undefined}>
      {name}
      {showUsername && known && <span className="text-muted ms-1 small">({username})</span>}
    </span>
  );
}
