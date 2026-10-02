'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getCommunityMeetings } from '@/libs/communityPagesApi';
import ContactName from '@/components/ContactName';
import type { CommunityMeeting } from '@/types/communityPages';

interface Props { communityId: string; }

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Small month-view calendar. Days with meetings tagged with this community
 * are highlighted; click a day to list them (date links open the contact).
 */
export default function CommunityCalendar({ communityId }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());   // 0-based
  const [selected, setSelected] = useState<string | null>(null);

  const { data: meetings, isLoading } = useQuery<CommunityMeeting[]>({
    queryKey: ['community-meetings', communityId],
    queryFn: () => getCommunityMeetings(communityId),
    staleTime: 60_000,
  });

  // date -> meetings
  const byDate = useMemo(() => {
    const m = new Map<string, CommunityMeeting[]>();
    for (const mt of meetings ?? []) {
      if (!m.has(mt.meetingDate)) m.set(mt.meetingDate, []);
      m.get(mt.meetingDate)!.push(mt);
    }
    return m;
  }, [meetings]);

  // Build the grid: Monday-first, padded to full weeks
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;          // Sunday=0 → Monday-first
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: (Date | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(year, month, d));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [year, month]);

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear()); setMonth(d.getMonth()); setSelected(null);
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const todayKey = ymd(today);
  const selectedMeetings = selected ? byDate.get(selected) ?? [] : [];
  const monthCount = cells.filter((c) => c && byDate.has(ymd(c))).reduce((n, c) => n + (byDate.get(ymd(c!))?.length ?? 0), 0);

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
        <h6 className="fw-semibold mb-0">📅 Meetings</h6>
        <div className="d-flex align-items-center gap-1">
          <button className="btn btn-outline-secondary btn-sm py-0 px-2" onClick={() => shift(-1)}>‹</button>
          <span className="small fw-medium px-2" style={{ minWidth: 120, textAlign: 'center' }}>{monthLabel}</span>
          <button className="btn btn-outline-secondary btn-sm py-0 px-2" onClick={() => shift(1)}>›</button>
        </div>
      </div>
      <div className="card-body py-2">
        {isLoading && <div className="text-center py-2"><span className="spinner-border spinner-border-sm text-muted" /></div>}

        <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-muted" style={{ fontSize: '0.65rem' }}>{d}</div>
          ))}
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} />;
            const key = ymd(cell);
            const count = byDate.get(key)?.length ?? 0;
            const isToday = key === todayKey;
            const isSel = key === selected;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(isSel ? null : key)}
                className={`btn btn-sm p-0 position-relative ${
                  isSel ? 'btn-primary' : count ? 'btn-outline-primary fw-bold' : 'btn-light'
                } ${isToday && !isSel ? 'border border-dark' : ''}`}
                style={{ height: 30, fontSize: '0.75rem' }}
                title={count ? `${count} meeting${count > 1 ? 's' : ''}` : undefined}
              >
                {cell.getDate()}
                {count > 0 && !isSel && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: '0.5rem', padding: '2px 4px' }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        <small className="text-muted d-block mt-2">
          {monthCount} meeting{monthCount !== 1 ? 's' : ''} this month &middot; {meetings?.length ?? 0} total
        </small>

        {selected && (
          <div className="mt-2 pt-2 border-top">
            <div className="small fw-medium mb-1">
              {new Date(selected).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' })}
            </div>
            {selectedMeetings.length === 0 && <p className="text-muted small mb-0">No meetings.</p>}
            {selectedMeetings.map((m) => (
              <div key={m.meetingId} className="small py-1 border-bottom">
                <Link href={`/contacts/${m.contactId}`} className="text-decoration-none fw-medium">
                  🤝 {m.title || 'Meeting'}
                </Link>
                <span className="text-muted ms-2">— <ContactName contactId={m.contactId} /> &middot; {m.username}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
