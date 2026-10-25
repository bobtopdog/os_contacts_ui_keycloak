'use client';


import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import AdminLookupSection from '@/components/admin/AdminLookupSection';
import type { LookupKind } from '@/types/adminLookup';
import OutcomesAdminSection from '@/components/admin/OutcomesAdminSection';
import { isAdminUser } from '@/libs/adminCheck';

type AdminTab = LookupKind | 'outcomes';

//const ADMIN_ROLE = 'admin';   // keep in sync with src/libs/adminAuth.ts

const TABS: { kind: AdminTab; label: string; nameLabel: string; showUrl?: boolean }[] = [
  { kind: 'tags',  label: '🏷️ Tags',  nameLabel: 'Tag' },
  { kind: 'areas', label: '🗺️ Understanding', nameLabel: 'Understanding' },
  { kind: 'teams', label: '👥 Teams', nameLabel: 'Team name', showUrl: true },
  { kind: 'outcomes', label: '🎯 Outcomes', nameLabel: 'Outcome' },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  //const [activeTab, setActiveTab] = useState<LookupKind>('tags');
  const [activeTab, setActiveTab] = useState<AdminTab>('tags');

  if (status === 'loading') {
    return (
      <div className="text-center py-5"><span className="spinner-border" /></div>
    );
  }

  const roles: string[] = (session?.user as { roles?: string[] } | undefined)?.roles ?? [];
  const isAdmin = isAdminUser(session?.user);

  if (!isAdmin) {
    return (
      <div className="text-center py-5">
        <div style={{ fontSize: '3rem' }}>🔒</div>
        <h1 className="h4 fw-bold mt-2">Admin access required</h1>
        <p className="text-muted">
          Your account does not have the administrator role. If you believe this
          is incorrect, please contact your system administrator.
        </p>
        <Link href="/" className="btn btn-outline-primary btn-sm">← Back to home</Link>
      </div>
    );
  }

  const current = TABS.find((t) => t.kind === activeTab)!;

  return (
    <>
  
      <div className="mb-4">
        
        <p className="lead">Administration</p>
        <p className="text-muted mb-0">
          Manage lookup lists. Rows cannot be deleted — untick <strong>Active</strong> to
          hide a row from user dropdowns while preserving history.
        </p>
      </div>

      <ul className="nav nav-tabs mb-3">
        {TABS.map((tab) => (
          <li className="nav-item" key={tab.kind}>
            <button
              className={`nav-link ${activeTab === tab.kind ? 'active fw-semibold' : ''}`}
              onClick={() => setActiveTab(tab.kind)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {current.kind === 'outcomes' ? (
      <OutcomesAdminSection />
    ) : (
      <AdminLookupSection
        key={current.kind}
        kind={current.kind}
        title={current.label}
        nameLabel={current.nameLabel}
        showUrl={current.showUrl}
      />
    )}
    </>
  );
}
