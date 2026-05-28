import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function okPaginated<T>(
  data: T[],
  meta: Record<string, unknown>,
  init?: ResponseInit,
) {
  return NextResponse.json({ data, meta }, init);
}

export function notFound(resource: string, id: string | number) {
  return NextResponse.json(
    { error: { code: "not_found", message: `${resource} ${id} not found` } },
    { status: 404 },
  );
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json(
    { error: { code: "bad_request", message, details } },
    { status: 400 },
  );
}

export function serverError(err: unknown) {
  // Surface validation errors as 400; everything else as 500 with a stable shape.
  if (err instanceof ZodError) {
    return badRequest("Invalid query parameters", err.flatten());
  }
  // Log full server-side; never leak internals to the client.
  console.error("[api] unhandled error:", err);
  return NextResponse.json(
    { error: { code: "internal_error", message: "Internal server error" } },
    { status: 500 },
  );
}
