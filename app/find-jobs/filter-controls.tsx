"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type FilterControlsProps = {
  isSearching?: boolean;
};

export function FilterControls({}: FilterControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentFilter = searchParams.get("filter") || "all";
  const currentSort = searchParams.get("sort") || "newest";
  const initialSearch = searchParams.get("q") || "";

  const [searchVal, setSearchVal] = useState(initialSearch);

  // Sync state if URL changes externally
  useEffect(() => {
    setSearchVal(initialSearch);
  }, [initialSearch]);

  // Debounced URL updates for search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchVal.trim() !== initialSearch) {
        updateUrl({ q: searchVal.trim(), page: "1" });
      }
    }, 450);
    return () => clearTimeout(handler);
  }, [searchVal, initialSearch]);

  function updateUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === "" || val === null || val === undefined) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    startTransition(() => {
      router.push(`/find-jobs?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-md">
        <input
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="w-full rounded-md border border-border bg-surface pl-4 pr-10 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Filter by company or role..."
        />
        {isPending && (
          <div className="absolute right-3 top-3.5 flex h-4 w-4 items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Filter Tabs */}
        <div className="inline-flex rounded-lg border border-border bg-surface-secondary p-1">
          <button
            onClick={() => updateUrl({ filter: "all", page: "1" })}
            className={`rounded-md px-4 py-1.5 text-xs font-semibold tracking-[0.03em] uppercase transition-all ${
              currentFilter === "all"
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            All Matches
          </button>
          <button
            onClick={() => updateUrl({ filter: "high", page: "1" })}
            className={`rounded-md px-4 py-1.5 text-xs font-semibold tracking-[0.03em] uppercase transition-all ${
              currentFilter === "high"
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            High Match (≥70)
          </button>
          <button
            onClick={() => updateUrl({ filter: "low", page: "1" })}
            className={`rounded-md px-4 py-1.5 text-xs font-semibold tracking-[0.03em] uppercase transition-all ${
              currentFilter === "low"
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Low Match (&lt;70)
          </button>
        </div>

        {/* Sort Dropdown */}
        <select
          value={currentSort}
          onChange={(e) => updateUrl({ sort: e.target.value, page: "1" })}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="score">Highest Score</option>
        </select>
      </div>
    </div>
  );
}

type PaginationControlsProps = {
  totalCount: number;
  currentPage: number;
  pageSize: number;
};

export function PaginationControls({ totalCount, currentPage, pageSize }: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIdx = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalCount);

  function updatePage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    startTransition(() => {
      router.push(`/find-jobs?${params.toString()}`);
    });
  }

  return (
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm text-text-secondary">
      <span>
        Showing <span className="font-semibold text-text-primary">{startIdx}</span> to{" "}
        <span className="font-semibold text-text-primary">{endIdx}</span> of{" "}
        <span className="font-semibold text-text-primary">{totalCount}</span> results
      </span>

      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            disabled={currentPage === 1 || isPending}
            onClick={() => updatePage(currentPage - 1)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.03em] text-text-primary hover:bg-surface-secondary disabled:opacity-50"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              disabled={isPending}
              onClick={() => updatePage(p)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-all ${
                currentPage === p
                  ? "border-accent bg-accent text-accent-foreground shadow-sm"
                  : "border-border bg-surface text-text-primary hover:bg-surface-secondary"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages || isPending}
            onClick={() => updatePage(currentPage + 1)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.03em] text-text-primary hover:bg-surface-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
