"use client";


import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

type DeptOption = { id: number; name: string };

const DEBOUNCE_MS = 300;

export default function SearchBar({ departments }: { departments: DeptOption[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname(); // e.g. "/" or "/ministers"

  const [name, setName] = useState(sp.get("name") ?? "");
  const [dept, setDept] = useState(sp.get("department_id") ?? "");
  const [isPending, startTransition] = useTransition();

  // Keep the inputs in sync when the URL changes via back/forward.
  // The ref tracks the last query string WE pushed so we don't fight
  // our own router updates.
  const lastPushed = useRef<string>("");
  useEffect(() => {
    if (sp.toString() !== lastPushed.current) {
      setName(sp.get("name") ?? "");
      setDept(sp.get("department_id") ?? "");
    }
  }, [sp]);

  // Push a filter state to the URL — wrapped in startTransition so React
  // exposes a pending flag we can show in the UI.
  const pushFilters = useCallback(
    (nextName: string, nextDept: string) => {
      const next = new URLSearchParams();
      if (nextName.trim()) next.set("name", nextName.trim());
      if (nextDept)        next.set("department_id", nextDept);
      const qs = next.toString();
      lastPushed.current = qs;
      startTransition(() => {
       // router.push(qs ? `/?${qs}` : "/");
       router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [router],
  );

  // Debounce the name input — push to URL only after the user stops
  // typing for DEBOUNCE_MS. Department changes don't debounce.
  useEffect(() => {
    const urlName = sp.get("name") ?? "";
    if (name === urlName) return; // already in sync, no push needed
    const handle = setTimeout(() => {
      pushFilters(name, dept);
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // We deliberately omit `dept` and `sp` from deps — dept has its own
    // handler, and sp updates would reset the timer mid-typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  function onDeptChange(value: string) {
    setDept(value);
    pushFilters(name, value); // submit instantly on selection
  }

  function reset() {
    setName("");
    setDept("");
    pushFilters("", "");
  }

  const hasFilters = name.trim() !== "" || dept !== "";

  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">Search members</h5>
          {isPending && (
            <span className="text-muted small">
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              />
              Searching…
            </span>
          )}
        </div>
        <div className="row g-3">
          <div className="col-md-6">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              id="name"
              type="text"
              className="form-control"
              placeholder="Start typing a name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="dept" className="form-label">Department</label>
            <select
              id="dept"
              className="form-select"
              value={dept}
              onChange={(e) => onDeptChange(e.target.value)}
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
        {hasFilters && (
          <div className="mt-3">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={reset}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
