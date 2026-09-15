'use client';

import { useRef, useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import ForceGraph2D from 'react-force-graph-2d';
import type { NetworkData, NetworkNode, NetworkLink } from '@/types/network';

const NOTES_API = process.env.NEXT_PUBLIC_NOTES_API_URL ?? 'http://localhost:3000';

export const NODE_COLOURS = {
  teamMine:    '#198754',
  team:        '#0d6efd',
  contactMine: '#fd7e14',
  contact:     '#6c757d',
};

const FADED_ALPHA = 0.12;

async function fetchNetwork(username: string): Promise<NetworkData> {
  const res = await fetch(
    `${NOTES_API}/api/network?username=${encodeURIComponent(username)}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error(`Failed to fetch network: ${res.status}`);
  return (await res.json()).data;
}

function linkWidth(weight: number) {
  return Math.min(1 + Math.sqrt(weight), 8);
}

// After the physics engine starts, link.source/target become node objects
function endpointId(v: unknown): string {
  return typeof v === 'object' && v !== null ? (v as { id: string }).id : (v as string);
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}


interface NodeStats {
  connections: number;
  totalInteractions: number;
  breakdown: { notes: number; meetings: number; poc: number; documents: number; links: number };
  topCounterpartLabel: string | null;
  lastActivity: string | null;
}

/**
 * Interactive team ↔ contact relationship graph with:
 *  - emoji icons inside the coloured shapes
 *  - hover highlighting (neighbours stay lit, everything else fades)
 *  - rich hover cards with live stats
 */
export default function NetworkGraph() {
  const router = useRouter();
  const { data: session } = useSession();
  const username = session?.user?.username ?? '';
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hoverNode, setHoverNode] = useState<NetworkNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { data, isLoading, isError } = useQuery<NetworkData>({
    queryKey: ['network', username],
    queryFn: () => fetchNetwork(username),
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  });

  // Adjacency (nodeId -> neighbour ids) + per-node stats, computed once per dataset
  const { neighbours, nodeStats } = useMemo(() => {
    const neighbours = new Map<string, Set<string>>();
    const nodeStats = new Map<string, NodeStats>();
    if (!data) return { neighbours, nodeStats };

    const labelById = new Map(data.nodes.map((n) => [n.id, n.label]));

    const ensureStats = (id: string): NodeStats => {
      let s = nodeStats.get(id);
      if (!s) {
        s = {
          connections: 0, totalInteractions: 0,
          breakdown: { notes: 0, meetings: 0, poc: 0, documents: 0, links: 0 },
          topCounterpartLabel: null, lastActivity: null,
        };
        nodeStats.set(id, s);
      }
      return s;
    };
    const heaviest = new Map<string, number>();

    for (const link of data.links as NetworkLink[]) {
      const s = endpointId(link.source);
      const t = endpointId(link.target);

      if (!neighbours.has(s)) neighbours.set(s, new Set());
      if (!neighbours.has(t)) neighbours.set(t, new Set());
      neighbours.get(s)!.add(t);
      neighbours.get(t)!.add(s);

      for (const [self, other] of [[s, t], [t, s]] as const) {
        const stats = ensureStats(self);
        stats.connections += 1;
        stats.totalInteractions += link.weight;
        stats.breakdown.notes += link.breakdown.notes;
        stats.breakdown.meetings += link.breakdown.meetings;
        stats.breakdown.poc += link.breakdown.poc;
        stats.breakdown.documents += link.breakdown.documents;
        stats.breakdown.links += link.breakdown.links;
        if (link.weight > (heaviest.get(self) ?? 0)) {
          heaviest.set(self, link.weight);
          stats.topCounterpartLabel = labelById.get(other) ?? null;
        }
        if (link.lastActivity &&
            (!stats.lastActivity || link.lastActivity > stats.lastActivity)) {
          stats.lastActivity = link.lastActivity;
        }
      }
    }
    return { neighbours, nodeStats };
  }, [data]);

  const isRelated = useCallback((nodeId: string) => {
    if (!hoverNode) return true;
    if (nodeId === hoverNode.id) return true;
    return neighbours.get(hoverNode.id)?.has(nodeId) ?? false;
  }, [hoverNode, neighbours]);

  const handleNodeClick = useCallback((node: any) => {
    const n = node as NetworkNode;
    router.push(n.type === 'team' ? `/teams/${n.entityId}` : `/contacts/${n.entityId}`);
  }, [router]);

  const handleNodeHover = useCallback((node: any) => {
    setHoverNode(node ?? null);
    if (containerRef.current) {
      containerRef.current.style.cursor = node ? 'pointer' : 'default';
    }
  }, []);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const n = node as NetworkNode & { x: number; y: number };
    const isTeam = n.type === 'team';
    const size = isTeam ? 7 : 5;
    const faded = !isRelated(n.id);

    ctx.globalAlpha = faded ? FADED_ALPHA : 1;

    ctx.beginPath();
    if (isTeam) {
      ctx.arc(n.x, n.y, size, 0, 2 * Math.PI);
      ctx.fillStyle = n.mine ? NODE_COLOURS.teamMine : NODE_COLOURS.team;
    } else {
      ctx.rect(n.x - size, n.y - size, size * 2, size * 2);
      ctx.fillStyle = n.mine ? NODE_COLOURS.contactMine : NODE_COLOURS.contact;
    }
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Emoji icon inside the shape
    ctx.font = `${size * 0.75}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isTeam ? '👥' : '📇', n.x, n.y + 0.5);

    // Label below
    const fontSize = Math.max(12 / globalScale, 3);
    ctx.font = `${isTeam || n.mine ? 'bold ' : ''}${fontSize}px Sans-Serif`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#212529';
    ctx.fillText(n.label, n.x, n.y + size + 2);

    ctx.globalAlpha = 1;
  }, [isRelated]);

  const linkColour = useCallback((link: any) => {
    if (!hoverNode) return '#adb5bd';
    const related =
      endpointId(link.source) === hoverNode.id || endpointId(link.target) === hoverNode.id;
    return related ? '#868e96' : `rgba(173, 181, 189, ${FADED_ALPHA})`;
  }, [hoverNode]);

  if (isLoading || !username) {
    return (
      <div className="text-center text-muted py-5">
        <span className="spinner-border me-2" />Building network…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="alert alert-warning">
        Could not load the network. Please try refreshing.
      </div>
    );
  }

  if (data.nodes.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        <div style={{ fontSize: '3rem' }}>🕸️</div>
        <p className="mt-2">No relationships recorded yet — the graph will grow as
        team members add notes, meetings and documents to contacts.</p>
      </div>
    );
  }
async function handleExportPdf() { 
  const canvas = containerRef.current?.querySelector('canvas'); 
  if (!canvas) return; 
 

const { jsPDF } = await import('jspdf'); 
 

const snapshot = document.createElement('canvas'); 
  snapshot.width = canvas.width; 
  snapshot.height = canvas.height; 
  const ctx = snapshot.getContext('2d')!; 
  ctx.fillStyle = '#ffffff'; 
  ctx.fillRect(0, 0, snapshot.width, snapshot.height); 
  ctx.drawImage(canvas, 0, 0); 
 

const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }); 
  const pageW = pdf.internal.pageSize.getWidth(); 
  const pageH = pdf.internal.pageSize.getHeight(); 
  const exported = new Date().toLocaleString('en-GB'); 
 

// ---- Header banner ---- 
  pdf.setFontSize(8); 
  pdf.setTextColor(180, 30, 30); 
  pdf.text('FOR INTERNAL USE ONLY', pageW / 2, 8, { align: 'center' }); 
 

pdf.setFontSize(16); 
  pdf.setTextColor(0); 
  pdf.text('Relationship Network', 14, 16); 
  pdf.setFontSize(9); 
  pdf.setTextColor(120); 
  pdf.text(`Exported by ${username} on ${exported}`, 14, 22); 
 

// ---- Legend ---- 
  const legend: [string, string][] = [ 
    ['#198754', 'My team'], ['#0d6efd', 'Team'], 
    ['#fd7e14', 'My PoC contact'], ['#6c757d', 'Contact'], 
  ]; 
  let lx = 14; 
  legend.forEach(([colour, label]) => { 
    pdf.setFillColor(colour); 
    pdf.rect(lx, 25, 3, 3, 'F'); 
    pdf.setTextColor(60); 
    pdf.text(label, lx + 4.5, 27.5); 
    lx += pdf.getTextWidth(label) + 14; 
  }); 
 

// ---- Graph image (leaves room for the footer) ---- 
  const margin = 14, top = 33, footerH = 10; 
  const availW = pageW - margin * 2; 
  const availH = pageH - top - margin - footerH; 
  const scale = Math.min(availW / snapshot.width, availH / snapshot.height); 
  const imgW = snapshot.width * scale; 
  const imgH = snapshot.height * scale; 
 

pdf.addImage( 
    snapshot.toDataURL('image/png'), 'PNG', 
    margin + (availW - imgW) / 2, top, imgW, imgH 
  ); 
 

// ---- Footer ---- 
  const footerY = pageH - 6; 
  pdf.setFontSize(8); 
  pdf.setTextColor(120); 
  pdf.text(`${username} · ${exported}`, 14, footerY); 
  pdf.setTextColor(180, 30, 30); 
  pdf.text('FOR INTERNAL USE ONLY', pageW / 2, footerY, { align: 'center' }); 
  pdf.setTextColor(120); 
  pdf.text('Page 1 of 1', pageW - 14, footerY, { align: 'right' });
  
pdf.save(`relationship-network-${new Date().toISOString().split('T')[0]}.pdf`); 
} 



  const stats = hoverNode ? nodeStats.get(hoverNode.id) : undefined;

  return (
    <div
      ref={containerRef}
      className="border rounded bg-white position-relative"
      style={{ height: '75vh', overflow: 'hidden' }}
      onMouseMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={data}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={(node: any, color, ctx) => {
          const size = node.type === 'team' ? 7 : 5;
          ctx.fillStyle = color;
          ctx.fillRect(node.x - size, node.y - size, size * 2, size * 2);
        }}
        linkWidth={(link: any) => linkWidth(link.weight)}
        linkColor={linkColour}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        cooldownTicks={100}
        onEngineStop={() => graphRef.current?.zoomToFit(400, 60)}
      />
      <button 
  className="btn btn-outline-secondary btn-sm position-absolute" 
  style={{ top: 10, right: 10, zIndex: 5 }} 
  onClick={handleExportPdf} 
  title="Export as PDF" 
> 
  📄 Export PDF 
</button> 


      {/* Rich hover card */}
      {hoverNode && stats && (
        <div
          className="card shadow border-0 position-absolute"
          style={{
            left: Math.min(mousePos.x + 14, (containerRef.current?.clientWidth ?? 400) - 290),
            top: mousePos.y + 14,
            width: 280,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div
            className="card-header py-2 text-white fw-semibold d-flex align-items-center gap-2"
            style={{
              background: hoverNode.type === 'team'
                ? (hoverNode.mine ? NODE_COLOURS.teamMine : NODE_COLOURS.team)
                : (hoverNode.mine ? NODE_COLOURS.contactMine : NODE_COLOURS.contact),
            }}
          >
            <span>{hoverNode.type === 'team' ? '👥' : '📇'}</span>
            <span className="text-truncate">{hoverNode.label}</span>
          </div>
          <div className="card-body py-2 px-3 small">

            {hoverNode.type === 'team' ? (
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Members</span>
                <span className="fw-medium">{hoverNode.memberCount ?? 0}</span>
              </div>
            ) : (
              <>
                {hoverNode.organisation && (
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Organisation</span>
                    <span className="fw-medium text-truncate ms-2">{hoverNode.organisation}</span>
                  </div>
                )}
                {hoverNode.mine && (
                  <div className="py-1 border-bottom">
                    <span className="badge bg-warning text-dark rounded-pill">⭐ You are PoC</span>
                  </div>
                )}
              </>
            )}

            <div className="d-flex justify-content-between py-1 border-bottom">
              <span className="text-muted">
                {hoverNode.type === 'team' ? 'Connected contacts' : 'Connected teams'}
              </span>
              <span className="fw-medium">{stats.connections}</span>
            </div>

            <div className="d-flex justify-content-between py-1 border-bottom">
              <span className="text-muted">Total interactions</span>
              <span className="fw-medium">{stats.totalInteractions}</span>
            </div>

            <div className="py-1 border-bottom text-muted">
              📝 {stats.breakdown.notes} &middot; 🤝 {stats.breakdown.meetings}
              {' '}&middot; ⭐ {stats.breakdown.poc} &middot; 📎 {stats.breakdown.documents}
              {' '}&middot; 🔗 {stats.breakdown.links}
            </div>

            {stats.topCounterpartLabel && (
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Strongest link</span>
                <span className="fw-medium text-truncate ms-2">{stats.topCounterpartLabel}</span>
              </div>
            )}

            <div className="d-flex justify-content-between py-1">
              <span className="text-muted">Last activity</span>
              <span className="fw-medium">{formatDate(stats.lastActivity)}</span>
            </div>

            <div className="text-center text-muted mt-1" style={{ fontSize: '0.7rem' }}>
              Click to open
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
