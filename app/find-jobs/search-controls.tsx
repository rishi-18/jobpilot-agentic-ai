"use client";

import { useState } from "react";
import { usePostHog } from "posthog-js/react";
import { useRouter } from "next/navigation";

type SearchControlsProps = {
  userId: string;
};

export function SearchControls({ userId }: SearchControlsProps) {
  const posthog = usePostHog();
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleFindJobsClick(e: React.FormEvent) {
    e.preventDefault();
    const titleVal = jobTitle.trim() || "Frontend Engineer";
    const locVal = location.trim();

    setIsLoading(true);
    setStatus(null);

    // Track event client-side as well
    if (posthog) {
      posthog.capture("job_search_started", {
        userId,
        jobTitle: titleVal,
        location: locVal,
      });
    }

    try {
      const res = await fetch("/api/agent/find", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTitle: titleVal,
          location: locVal,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setStatus({
          type: "error",
          message: result.error || "Failed to find matching jobs.",
        });
      } else {
        setStatus({
          type: "success",
          message: `Found ${result.data.jobsFound} jobs and saved matches to your dashboard.`,
        });
        // Trigger server components refresh
        router.refresh();
      }
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "An unexpected network error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleFindJobsClick} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
        <label className="space-y-2">
          <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Job Title</span>
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-md border border-border bg-surface px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
            placeholder="Frontend Engineer"
          />
        </label>
        <label className="space-y-2">
          <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Location</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-md border border-border bg-surface px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
            placeholder="Remote, New York..."
          />
        </label>
        <button
          type="submit"
          disabled={isLoading}
          className="mt-auto inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-[14px] font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-dark disabled:opacity-50 min-w-[120px]"
        >
          {isLoading ? "Searching..." : "Find Jobs"}
        </button>
      </div>

      {status && (
        <div
          role="alert"
          className={`mt-4 rounded-xl border px-4 py-3 text-[14px] font-medium ${
            status.type === "success"
              ? "border-success-light bg-success-lightest text-success-darker"
              : "border-error bg-error-lightest text-error"
          }`}
        >
          {status.message}
        </div>
      )}
    </form>
  );
}