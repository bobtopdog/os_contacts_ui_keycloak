# Relationship Network Visualisation — Integration

## Files

| File | Purpose |
|------|---------|
| `src/types/network.ts` | Node/link/graph interfaces |
| `src/libs/networkRepository.ts` | The UNION ALL aggregation across all five activity tables |
| `src/app/api/network/route.ts` | GET graph endpoint (resolves contact names server-side) |
| `src/components/NetworkGraph.tsx` | The interactive force-directed graph |
| `src/app/network/page.tsx` | The /network page with legend + dynamic ssr:false import |

## Setup

1. New dependency:

       npm install react-force-graph-2d

2. Copy the files in. No migration — the query reads existing tables.

3. Add a nav link wherever suits:

       <Link href="/network" className="nav-link">🕸️ Network</Link>

## Visual mapping (matches the client's diagram)

- ⚫ Blue circles = teams (bold labels)
- ⬜ Grey squares = contacts
- Edge thickness = interaction count (sqrt-scaled, capped, so one hyperactive
  relationship can't dwarf everything else)
- Click any node → navigates to /teams/:id or /contacts/:id
- Drag nodes, scroll-zoom, pan; auto-fits the viewport once physics settles

## How relationships are computed

Every row in contact_notes, contact_meetings, contact_poc,
contact_documents and contact_links is one "interaction" by a username.
Usernames map to teams via user_teams; interactions are grouped by
(team, contact) and counted. A user in several teams contributes their
activity to each — the relationship exists through them.

## Performance notes

- The heavy lifting (aggregation + name resolution) happens server-side;
  the browser gets one ready-to-render JSON payload, cached for 5 minutes
  by TanStack Query.
- Contact names resolve via Promise.allSettled against the contacts API —
  on OpenShift this uses your internal cluster URL, and failures degrade
  to "Unknown contact" rather than breaking the graph.
- Canvas rendering comfortably handles hundreds of nodes. If the dataset
  grows into thousands, add a WHERE filter (e.g. minimum weight, or a
  per-team view) — flag it and we'll optimise then.

## OpenShift note

Nothing new needed — the /api/network route is part of the frontend app,
and its outbound call to the contacts API already follows the
internal/external URL logic in api.ts.
