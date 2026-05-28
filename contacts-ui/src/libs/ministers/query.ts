import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */
export const paginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type Pagination = z.infer<typeof paginationSchema>;

export function parsePagination(searchParams: URLSearchParams): Pagination {
  return paginationSchema.parse({
    page:  searchParams.get("page")  ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });
}

export function paginationMeta(total: number, p: Pagination) {
  const totalPages = Math.max(1, Math.ceil(total / p.limit));
  return {
    page:        p.page,
    limit:       p.limit,
    total,
    total_pages: totalPages,
    has_next:    p.page < totalPages,
    has_prev:    p.page > 1,
  };
}

/* ------------------------------------------------------------------ */
/* Filter helpers                                                      */
/* ------------------------------------------------------------------ */
export const postsFilterSchema = z.object({
  party:         z.string().optional(),
  department_id: z.coerce.number().int().optional(),
  active:        z.enum(["true", "false"]).optional(),
});

export const membersFilterSchema = z.object({
  party:         z.string().optional(),
  gender:        z.enum(["M", "F"]).optional(),
  name:          z.string().optional(),
  department_id: z.coerce.number().int().optional(),
});

export const departmentsFilterSchema = z.object({
  name: z.string().optional(),
});
