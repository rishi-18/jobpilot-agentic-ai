"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ResearchButtonProps = {
  jobId: string;
};

export function ResearchButton({ jobId }: ResearchButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleResearch() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/agent/research", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ jobId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to research company");
        }
        router.refresh();
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleResearch}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-dark disabled:opacity-50"
      >
        {isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
            Researching...
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Research Company
          </>
        )}
      </button>
      {error && (
        <span className="text-xs text-error font-medium" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
