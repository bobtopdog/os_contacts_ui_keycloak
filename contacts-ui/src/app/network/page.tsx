'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const NetworkGraph = dynamic(() => import('@/components/NetworkGraph'), {
  ssr: false,
  loading: () => (
    <div className="text-center text-muted py-5">
      <span className="spinner-border me-2" />Loading visualisation…
    </div>
  ),
});

function Dot({ colour, square = false }: { colour: string; square?: boolean }) {
  return (
    <span style={{
      display: 'inline-block', width: 12, height: 12,
      borderRadius: square ? 0 : '50%', background: colour, marginRight: 4,
    }} />
  );
}

export default function NetworkPage() {
  return (
    <>
      

      <div className="d-flex justify-content-between align-items-end mb-3 flex-wrap gap-2">
        <div>
          
          <p className="lead">Relationship Network</p>
          <p className="text-muted mb-0">
            How teams and contacts connect through recorded activity.
          </p>
        </div>
        <div className="text-muted small">
          <span className="me-3"><Dot colour="#198754" /> My team</span>
          <span className="me-3"><Dot colour="#0d6efd" /> Team</span>
          <span className="me-3"><Dot colour="#fd7e14" square /> My PoC contact</span>
          <span className="me-3"><Dot colour="#6c757d" square /> Contact</span>
          <span>Thicker line = more interactions</span>
        </div>
      </div>

      <NetworkGraph />

      <p className="text-muted small mt-2 mb-0">
        Drag nodes to rearrange &middot; scroll to zoom &middot; drag the background
        to pan &middot; click a node to open it.
      </p>
    </>
  );
}
