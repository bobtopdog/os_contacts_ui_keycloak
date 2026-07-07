import Link from "next/link";
import { notFound } from "next/navigation";
import { getMember } from "@/libs/ministers/api-client";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import MinisterNotes from "@/components/MinisterNotes";

export const dynamic = "force-dynamic";

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

function formatDate(d: string | null): string {
  if (!d) return "—";
  // dates come from the API as ISO date strings (YYYY-MM-DD)
  return new Date(d).toLocaleDateString("en-GB", {
    day:   "numeric",
    month: "long",
    year:  "numeric",
  });
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>; 
}) {
  const { id: idStr } = await params;
  const id = Number(idStr); 

  let member;
  try {
    const res = await getMember(id);
    member = res.data;
  } catch (err: unknown) {
    // The API returns 404 for missing members; surface as Next 404.
    if (err instanceof Error && err.message.includes("404")) notFound();
    throw err;
  }

  const currentPosts = member.posts_held.filter((p) => p.is_current);
  const formerPosts  = member.posts_held.filter((p) => !p.is_current);
  const session = await getServerSession(authOptions);

  return (
    <>
   
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/ministers/">Members</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {member.name_display_as}
          </li>
        </ol>
      </nav>

      {/* Header card */}
    
      <p className="lead">Government post-holders</p>
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h1 className="card-title h3 mb-1">{member.name_display_as}</h1>
          <p className="text-muted mb-2">{member.name_full_title}</p>
          <div>
            {member.party_name && (
              <span className={`badge ${partyBadgeClass(member.party_name)} me-2`}>
                {member.party_name}
              </span>
            )}
            {member.gender && (
              <span className="badge bg-light text-dark me-2">
                {member.gender === "M" ? "Male" : member.gender === "F" ? "Female" : member.gender}
              </span>
            )}
            <span className="text-muted small">Member ID: {member.id}</span>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Posts column */}
        <div className="col-lg-7">
          <h2 className="h5 mb-3">Government posts</h2>

          {currentPosts.length > 0 && (
            <div className="mb-4">
              <h3 className="h6 text-success">Current</h3>
              {currentPosts.map((p) => (
                <div
                  key={`${p.post_id}-${p.start_date}`}
                  className="card mb-2 border-success-subtle"
                >
                  <div className="card-body py-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <strong>{p.post_name}</strong>
                        {p.hansard_name && p.hansard_name !== p.post_name && (
                          <div className="text-muted small">
                            Hansard: {p.hansard_name}
                          </div>
                        )}
                      </div>
                      <span className="badge bg-success">Current</span>
                    </div>
                    <div className="text-muted small mt-1">
                      Since {formatDate(p.start_date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {formerPosts.length > 0 && (
            <div>
              <h3 className="h6 text-muted">Former</h3>
              {formerPosts.map((p) => (
                <div key={`${p.post_id}-${p.start_date}`} className="card mb-2">
                  <div className="card-body py-2">
                    <strong>{p.post_name}</strong>
                    <div className="text-muted small mt-1">
                      {formatDate(p.start_date)} – {formatDate(p.end_date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {member.posts_held.length === 0 && (
            <div className="alert alert-light">No post history recorded.</div>
          )}

          <div>
            <MinisterNotes memberId={member.id} />

         
          </div>


        </div>

        {/* Contacts column */}
        <div className="col-lg-5">
          <h2 className="h5 mb-3">Contact information</h2>
          {member.contacts.length === 0 ? (
            <div className="alert alert-light">No contact details available.</div>
          ) : (
            member.contacts.map((c, idx) => (
              <div key={idx} className="card mb-2 shadow-sm">
                <div className="card-body">
                  <h6 className="card-subtitle text-muted mb-2">
                    {c.type ?? "Contact"}
                  </h6>
                  {c.line1 && (
                    <div className="mb-1">
                      <span className="text-muted small me-2">📍</span>
                      {c.line1}
                    </div>
                  )}
                  {c.phone && (
                    <div className="mb-1">
                      <span className="text-muted small me-2">📞</span>
                      
                        {c.phone}
                      
                    </div>
                  )}
                  {c.email && (
                    <div className="mb-1">
                      <span className="text-muted small me-2">✉️</span>
                      <a href={`mailto:${c.email}`}>{c.email}</a>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
