import { NextRequest, NextResponse } from 'next/server';
import {
  getGroupMembers, renameGroup, deleteGroup,
  getGroupAdminUsernames, getGroupName,
} from '@/libs/meetingGroupsRepository';
import { groupChangeAlert } from '@/libs/email';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * GET /api/meeting-groups/:groupId
 * Returns the group's member list.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;

  if (!isValidUuid(groupId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid group ID.' },
      { status: 400 }
    );
  }

  try {
    const members = await getGroupMembers(groupId);
    return NextResponse.json({ data: members });
  } catch (err) {
    console.error('GET group members error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/meeting-groups/:groupId
 * Body: { username, name }
 * Renames the group — admins only. Alerts all admins by email.
 */
export async function PATCH(
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

  let body: { username?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { username, name } = body;

  if (!username?.trim() || !name?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username and name are required.' },
      { status: 400 }
    );
  }

  try {
    const oldName = await getGroupName(groupId);
    const renamed = await renameGroup(groupId, username.trim(), name.trim());

    if (!renamed) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only group admins can rename the group.' },
        { status: 403 }
      );
    }

    // Requirement 4: alert all admins (fire-and-forget)
    getGroupAdminUsernames(groupId).then((admins) =>
      groupChangeAlert(
        admins,
        name.trim(),
        username.trim(),
        `Group renamed from "${oldName}" to "${name.trim()}"`
      )
    ).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH group error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/meeting-groups/:groupId
 * Body: { username }
 * Deletes the group — creator only.
 */
export async function DELETE(
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
    const deleted = await deleteGroup(groupId, body.username.trim());
    if (!deleted) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only the creator can delete this group.' },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE group error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
