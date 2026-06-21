"use client";

import { useRef } from "react";
import { usePostHog } from "posthog-js/react";

type SearchControlsProps = {
  userId: string;
};

export function SearchControls({ userId }: SearchControlsProps) {
  const posthog = usePostHog();
  const jobTitleRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);

  function handleFindJobsClick() {
    if (!posthog) return;

    const jobTitle = jobTitleRef.current?.value.trim() || "Frontend Engineer";
    const location = locationRef.current?.value.trim() || "Remote, New York";

    posthog.capture("job_search_started", {
      userId,
      jobTitle,
      location,
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
      <label className="space-y-2">
        <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Job Title</span>
        <input
          ref={jobTitleRef}
          className="w-full rounded-md border border-border bg-surface px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Frontend Engineer"
        />
      </label>
      <label className="space-y-2">
        <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Location</span>
        <input
          ref={locationRef}
          className="w-full rounded-md border border-border bg-surface px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Remote, New York..."
        />
      </label>
      <button
        type="button"
        onClick={handleFindJobsClick}
        className="mt-auto inline-flex items-center justify-center rounded-md bg-accent px-4 py-3 text-[14px] font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-dark"
      >
        Find Jobs
      </button>
    </div>
  );
}