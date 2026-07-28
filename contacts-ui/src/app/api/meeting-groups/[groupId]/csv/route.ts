import { NextRequest, NextResponse } from 'next/server';
import {
  getGroupMembers, getGroupName, isGroupMember,
} from '@/libs/meetingGroupsRepository';
import { usernameToEmail } from '@/libs/email';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * GET /api/meeting-groups/:groupId/csv?username=xxx
 * Requirement 6: any group member can download the member list as CSV.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const username = request.nextUrl.searchParams.get('username');

  if (!isValidUuid(groupId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid group ID.' },
      { status: 400 }
    );
  }
  if (!username?.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'username query parameter is required.' },
      { status: 400 }
    );
  }

  try {
    // Only members of the group can download the list
    if (!(await isGroupMember(groupId, username.trim()))) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only group members can download the member list.' },
        { status: 403 }
      );
    }

    const [members, groupName] = await Promise.all([
      getGroupMembers(groupId),
      getGroupName(groupId),
    ]);

    const header = 'Username,Email,Role,Added';
    const rows = members.map((m) =>
      [
        csvEscape(m.username),
        csvEscape(usernameToEmail(m.username)),
        csvEscape(m.role),
        csvEscape(m.addedAt.split('T')[0]),
      ].join(',')
    );
    const csv = [header, ...rows].join('\r\n');

    const safeName = groupName.replace(/[^a-z0-9-_ ]/gi, '').replace(/\s+/g, '-');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeName}-members.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('GET group CSV error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
