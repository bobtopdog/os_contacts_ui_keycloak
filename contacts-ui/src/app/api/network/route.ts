import { NextRequest, NextResponse } from 'next/server';
import {
  getNetworkEdges, getTeamMemberCounts, getUserTeamIds, getUserPocContactIds,
} from '@/libs/networkRepository';
import { getContact } from '@/libs/api';
import type { NetworkData, NetworkNode, NetworkLink } from '@/types/network';

/**
 * GET /api/network?username=xxx
 * Team↔contact relationship graph with:
 *  - mine flags (team membership / PoC) for the requesting user
 *  - team member counts, contact organisations
 *  - per-edge interaction breakdown + last activity
 */
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')?.trim() ?? '';

  try {
    const [edges, memberCounts, userTeamIds, userPocIds] = await Promise.all([
      getNetworkEdges(),
      getTeamMemberCounts(),
      username ? getUserTeamIds(username) : Promise.resolve([]),
      username ? getUserPocContactIds(username) : Promise.resolve([]),
    ]);

    const myTeams = new Set(userTeamIds);
    const myPocContacts = new Set(userPocIds);

    const teamMap = new Map<string, string>();
    const contactIds = new Set<string>();
    for (const e of edges) {
      teamMap.set(e.team_id, e.team_name);
      contactIds.add(e.contact_id);
    }

    // Resolve contact name + organisation in parallel; skip failures
    const idList = Array.from(contactIds);
    const results = await Promise.allSettled(idList.map((id) => getContact(id)));
    const contactInfo = new Map<string, { name: string; organisation: string }>();
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        contactInfo.set(idList[i], {
          name: r.value.fullName,
          organisation: r.value.organisation ?? '',
        });
      }
    });

    const nodes: NetworkNode[] = [
      ...Array.from(teamMap.entries()).map(([teamId, name]) => ({
        id: `team:${teamId}`,
        entityId: teamId,
        label: name,
        type: 'team' as const,
        mine: myTeams.has(teamId),
        memberCount: memberCounts.get(teamId) ?? 0,
      })),
      ...idList.map((contactId) => ({
        id: `contact:${contactId}`,
        entityId: contactId,
        label: contactInfo.get(contactId)?.name ?? 'Unknown contact',
        type: 'contact' as const,
        mine: myPocContacts.has(contactId),
        organisation: contactInfo.get(contactId)?.organisation ?? '',
      })),
    ];

    const links: NetworkLink[] = edges.map((e) => ({
      source: `team:${e.team_id}`,
      target: `contact:${e.contact_id}`,
      weight: e.weight,
      breakdown: {
        notes: e.notes,
        meetings: e.meetings,
        poc: e.poc,
        documents: e.documents,
        links: e.links,
      },
      lastActivity: e.last_activity ? e.last_activity.toISOString() : null,
    }));

    const data: NetworkData = { nodes, links };
    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/network error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
