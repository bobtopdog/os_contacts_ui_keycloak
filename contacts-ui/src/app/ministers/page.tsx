import Link from "next/link";
import { listDepartments, listMembers } from "@/libs/ministers/api-client";
import SearchBar from "@/components/MinisterSearch";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = "force-dynamic";

type SearchParams = {
  name?: string;
  department_id?: string;
  page?: string;
};

const PAGE_SIZE = 24;

function partyBadgeClass(party: string | null): string {
  if (!party) return "bg-secondary";
  const p = party.toLowerCase();
  if (p.includes("labour"))       return "bg-danger";
  if (p.includes("conservative")) return "bg-primary";
  if (p.includes("liberal"))      return "bg-warning text-dark";
  if (p.includes("green"))        return "bg-success";
  if (p.includes("snp"))          return "bg-warning text-dark";
  return "bg-secondary";
}

export default async function MembersPage({
  searchParams,
}: {
  // Next 15: searchParams is now a Promise — await before reading.
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const name = sp.name?.trim() || undefined;
  const department_id = sp.department_id ? Number(sp.department_id) : undefined;

  // Fetch departments and members in parallel
  const [deptRes, memberRes] = await Promise.all([
    listDepartments(),
    listMembers({ name, department_id, page, limit: PAGE_SIZE }),
  ]);

  const departments = deptRes.data
    .map((d) => ({ id: d.id, name: d.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const { data: members, meta } = memberRes;

  // Preserve filters across page links
  function pageHref(p: number): string {
    const qp = new URLSearchParams();
    if (name)          qp.set("name", name);
    if (department_id) qp.set("department_id", String(department_id));
    qp.set("page", String(p));
    return `/ministers/?${qp.toString()}`;
  }
  const session = await getServerSession(authOptions);

  return (
    <>
   
      <p className="lead">Government post-holders</p>
      <p className="text-muted">
        Search MPs and peers who currently hold UK government
        posts.
      </p>
      

      <SearchBar departments={departments} />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="text-muted">
          {meta.total === 0
            ? "No matches"
            : `Showing ${(meta.page - 1) * meta.limit + 1}–${Math.min(
                meta.page * meta.limit,
                meta.total,
              )} of ${meta.total}`}
        </span>
      </div>

      {members.length === 0 ? (
        <div className="alert alert-info">
          No members found. Try clearing the filters.
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
          {members.map((m) => {
            const currentPosts = m.posts_held.filter((p) => p.is_current);
            const displayPosts = currentPosts.length > 0
              ? currentPosts
              : m.posts_held.slice(0, 1);
            return (
              <div key={m.id} className="col">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title mb-1">
                      <Link
                        href={`/ministers/members/${m.id}`}
                        className="text-decoration-none"
                      >
                        {m.name_display_as ?? `Member ${m.id}`}
                      </Link>
                    </h5>
                    <p className="card-subtitle text-muted small mb-2">
                      {m.name_full_title}
                    </p>
                    {m.party_name && (
                      <span className={`badge ${partyBadgeClass(m.party_name)} me-1`}>
                        {m.party_name}
                      </span>
                    )}
                    <ul className="list-unstyled small mt-3 mb-0">
                      {displayPosts.map((p) => (
                        <li key={`${p.post_id}-${p.start_date}`}>
                          <strong>{p.post_name}</strong>
                          {p.is_current ? (
                            <span className="badge bg-success ms-2">Current</span>
                          ) : (
                            <span className="badge bg-light text-dark ms-2">
                              Former
                            </span>
                          )}
                        </li>
                      ))}
                      {currentPosts.length > 1 && (
                        <li className="text-muted">
                          + {currentPosts.length - 1} more current post
                          {currentPosts.length - 1 === 1 ? "" : "s"}
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className="card-footer bg-transparent">
                    <Link
                      href={`/ministers/members/${m.id}`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      View details →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {meta.total_pages > 1 && (
        <nav className="mt-4" aria-label="Pagination">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${meta.has_prev ? "" : "disabled"}`}>
              <Link
                className="page-link"
                href={meta.has_prev ? pageHref(meta.page - 1) : "#"}
              >
                Previous
              </Link>
            </li>
            <li className="page-item active">
              <span className="page-link">
                Page {meta.page} of {meta.total_pages}
              </span>
            </li>
            <li className={`page-item ${meta.has_next ? "" : "disabled"}`}>
              <Link
                className="page-link"
                href={meta.has_next ? pageHref(meta.page + 1) : "#"}
              >
                Next
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
}