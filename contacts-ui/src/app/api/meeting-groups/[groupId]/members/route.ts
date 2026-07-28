import { NextRequest, NextResponse } from 'next/server';
import {
  addGroupMember, getGroupAdminUsernames, getGroupName,
} from '@/libs/meetingGroupsRepository';
import { groupChangeAlert } from '@/libs/email';
import type { GroupRole } from '@/types/meetingGroup';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * POST /api/meeting-groups/:groupId/members
 * Body: { requestingUser, newUsername, role }
 * Admins only. Alerts all admins by email.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;

  if (!isValidUuid(groupId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid group ID.' },
      { status: 400 }
    );
  }

  let body: { requestingUser?: string; newUsername?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { requestingUser, newUsername } = body;
  const role: GroupRole = body.role === 'admin' ? 'admin' : 'viewer';

  if (!requestingUser?.trim() || !newUsername?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'requestingUser and newUsername are required.' },
      { status: 400 }
    );
  }

  try {
    const member = await addGroupMember(
      groupId, requestingUser.trim(), newUsername.trim(), role
    );

    if (!member) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only admins can add members, or the user is already a member.',
        },
        { status: 403 }
      );
    }

    // Requirement 4: alert all admins (fire-and-forget)
    Promise.all([getGroupAdminUsernames(groupId), getGroupName(groupId)])
      .then(([admins, name]) =>
        groupChangeAlert(
          admins, name, requestingUser.trim(),
          `${newUsername.trim()} was added as ${role}`
        )
      ).catch(console.error);

    return NextResponse.json({ data: member }, { status: 201 });
  } catch (err) {
    console.error('POST group member error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
