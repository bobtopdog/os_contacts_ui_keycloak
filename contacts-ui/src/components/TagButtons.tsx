'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getProfileTeams } from '@/libs/api';
import type { Tags } from '@/types/contact';

// Reuse the allTeams from getProfileTeams but with a dummy username
// since we only need the full list
async function getAllTags(): Promise<Tags[]> {
  const res = await fetch('/api/tags', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch tagss');
  const json = await res.json();
  return json.data;
}

export default function TagButtons() {
  const router = useRouter();

  const { data: tags, isLoading } = useQuery<Tags[]>({
    queryKey: ['all-tags'],
    queryFn: getAllTags,
  });

  if (isLoading) {
    return (
      <div className="mb-4 d-flex gap-2 flex-wrap">
        {[1, 2, 3].map((i) => (
          <div key={i} className="placeholder-glow">
            <span className="placeholder rounded-pill" style={{ width: '80px', height: '32px', display: 'block' }} />
          </div>
        ))}
      </div>
    );
  }

  if (!tags?.length) return null;

  return (
    <div className="mb-4">
      <p className="text-muted small fw-medium mb-2">Browse by tag:</p>
      <div className="d-flex gap-2 flex-wrap">
        {tags.map((tag) => (
          <button
            key={tag.Id}
            className="btn btn-outline-primary btn-sm rounded-pill"
            onClick={() => router.push(`/tagged/${encodeURIComponent(tag.tag)}`)}
          >
            👥 {tag.tag}
          </button>
        ))}
      </div>
    </div>
  );
}
