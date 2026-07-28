import { NextRequest, NextResponse } from 'next/server';
import {
  removeGroupMember, setMemberRole,
  getGroupAdminUsernames, getGroupName,
} from '@/libs/meetingGroupsRepository';
import { groupChangeAlert } from '@/libs/email';
import type { GroupRole } from '@/types/meetingGroup';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * DELETE /api/meeting-groups/:groupId/members/:memberId
 * Body: { username }
 * Admins only; the creator cannot be removed. Alerts all admins by email.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; memberId: string }> }
) {
  const { groupId, memberId } = await params;

  if (!isValidUuid(groupId) || !isValidUuid(memberId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid IDs.' },
      { status: 400 }
    );
  }

  let body: { username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  if (!body.username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username is required.' },
      { status: 400 }
    );
  }

  try {
    const result = await removeGroupMember(groupId, memberId, body.username.trim());
    if (!result.removed) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only admins can remove members, and the creator cannot be removed.',
        },
        { status: 403 }
      );
    }

    // Requirement 4: alert all admins (fire-and-forget)
    Promise.all([getGroupAdminUsernames(groupId), getGroupName(groupId)])
      .then(([admins, name]) =>
        groupChangeAlert(
          admins, name, body.username!.trim(),
          `${result.removedUsername} was removed from the group`
        )
      ).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE group member error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/meeting-groups/:groupId/members/:memberId
 * Body: { username, role }
 * Grants or revokes admin — creator only. Alerts all admins by email.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; memberId: string }> }
) {
  const { groupId, memberId } = await params;

  if (!isValidUuid(groupId) || !isValidUuid(memberId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid IDs.' },
      { status: 400 }
    );
  }

  let body: { username?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const role: GroupRole = body.role === 'admin' ? 'admin' : 'viewer';

  if (!body.username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username is required.' },
      { status: 400 }
    );
  }

  try {
    const result = await setMemberRole(groupId, memberId, body.username.trim(), role);
    if (!result.updated) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: "Only the creator can change roles, and the creator's role cannot be changed.",
        },
        { status: 403 }
      );
    }

    // Requirement 4: alert all admins (fire-and-forget)
    Promise.all([getGroupAdminUsernames(groupId), getGroupName(groupId)])
      .then(([admins, name]) =>
        groupChangeAlert(
          admins, name, body.username!.trim(),
          `${result.username}'s role was changed to ${role}`
        )
      ).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH member role error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
