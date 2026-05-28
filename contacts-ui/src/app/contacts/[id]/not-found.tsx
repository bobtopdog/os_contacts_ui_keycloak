import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="text-center py-5">
      <div style={{ fontSize: '3rem' }}>🔍</div>
      <h2 className="mt-3">Contact Not Found</h2>
      <p className="text-muted">That contact doesn't exist or may have been removed.</p>
      <Link href="/" className="btn btn-primary mt-2">
        ← Back to Search
      </Link>
    </div>
  );
}
