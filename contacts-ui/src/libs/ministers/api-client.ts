import { headers } from "next/headers";
import type {
  DepartmentDetail,
  Member,
  Paginated,
  Single,
} from "@/types/ministers/api";

/**
 * Resolve a base URL for our own API.
 *
 * On the server we read the host header so this works behind any proxy.
 * On the client we use a relative URL, which `fetch` resolves against
 * the current origin.
 *
 * NOTE: `headers()` is async in Next.js 15+, sync in Next.js 14.
 * This implementation uses the Next 15 async API.
 */
async function baseUrl(): Promise<string> {
  if (typeof window !== "undefined") return ""; // browser — relative URLs are fine
  //const h = await headers();
  //const host  = "localhost:3002" // h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3002";
  //const proto = h.get("x-forwarded-proto") ?? "http";
  const PARLIAMENT_API_BASE = process.env.NEXT_PUBLIC_PARLIAMENT_API_BASE_URL ?? 'http://localhost:3002';
  //return `${proto}://${host}`;
  return PARLIAMENT_API_BASE;
}

async function get<T>(path: string, search?: URLSearchParams): Promise<T> {
  
  const qs = search && [...search].length ? `?${search.toString()}` : "";
  const url = `${await baseUrl()}${path}${qs}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} for ${path}${qs}`);
  }
  return (await res.json()) as T;
}

export async function listMembers(opts: {
  name?: string;
  department_id?: number;
  page?: number;
  limit?: number;
}): Promise<Paginated<Member>> {
  const sp = new URLSearchParams();
  if (opts.name)          sp.set("name", opts.name);
  if (opts.department_id) sp.set("department_id", String(opts.department_id));
  if (opts.page)          sp.set("page", String(opts.page));
  if (opts.limit)         sp.set("limit", String(opts.limit));
  return get<Paginated<Member>>("/api/members", sp);
}

export async function getMember(id: number): Promise<Single<Member>> {
  return get<Single<Member>>(`/api/members/${id}`);
}

export async function listDepartments(): Promise<Paginated<DepartmentDetail>> {
  // Departments are small (~30) — fetch them all for the dropdown.
  const sp = new URLSearchParams({ limit: "200" });
  return get<Paginated<DepartmentDetail>>("/api/departments", sp);
}