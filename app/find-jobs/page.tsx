import Link from "next/link";

import { createInsforgeServer } from "@/lib/insforge-server";

import { NavbarAccountButton } from "../navbar-account-button";
import { UserSessionSync } from "../user-session-sync";
import { SearchControls } from "./search-controls";

type JobRow = {
  company: string;
  role: string;
  score: number;
  salary: string;
  source: "Search" | "URL";
  dateFound: string;
};

const jobs: JobRow[] = [
  { company: "Vercel", role: "Frontend Engineer", score: 94, salary: "$180k - $220k", source: "Search", dateFound: "Today" },
  { company: "Stripe", role: "UI Engineer", score: 88, salary: "$190k - $240k", source: "URL", dateFound: "Today" },
  { company: "Linear", role: "Product Engineer", score: 96, salary: "$150k - $190k", source: "Search", dateFound: "Yesterday" },
  { company: "Notion", role: "Frontend Developer", score: 72, salary: "$140k - $180k", source: "Search", dateFound: "Yesterday" },
  { company: "OpenAI", role: "Software Engineer", score: 91, salary: "$200k - $260k", source: "URL", dateFound: "2 days ago" },
  { company: "Figma", role: "Design Systems Engineer", score: 85, salary: "$170k - $220k", source: "Search", dateFound: "2 days ago" },
];

function scoreBar(score: number): string {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-info-medium";
  return "bg-warning";
}

export default async function FindJobsPage() {
  const insforge = await createInsforgeServer();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();

  const sessionUser = user
    ? { id: user.id, email: user.email ?? null, name: user.profile?.name ?? null }
    : null;
  const accountLabel = sessionUser?.name?.trim() || sessionUser?.email || "Account";

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <UserSessionSync user={sessionUser} />
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-8 pb-8">
        <header className="flex h-20 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground shadow-[0_8px_24px_rgba(124,92,252,0.24)]">
              <span className="text-sm font-semibold">J</span>
            </span>
            <span className="text-[19px] font-semibold tracking-[-0.03em] text-text-darkest">JobPilot</span>
          </div>

          <nav className="flex items-center gap-12 text-sm font-medium text-text-dark">
            <Link href="/dashboard" className="transition-colors hover:text-accent">Dashboard</Link>
            <Link href="/find-jobs" className="text-accent">Find Jobs</Link>
            <Link href="/profile" className="transition-colors hover:text-accent">Profile</Link>
          </nav>

          <NavbarAccountButton label={accountLabel} />
        </header>

        <section className="border-x border-border bg-surface px-8 py-8">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <SearchControls userId={user?.id ?? ""} />

            <div className="mt-4 rounded-xl border border-success-light bg-success-lightest px-4 py-3 text-[14px] font-medium text-success-darker">
              Found 8 jobs and saved 4 strong matches.
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <input
                className="w-full rounded-md border border-border bg-surface px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent lg:max-w-md"
                placeholder="Filter by company or role..."
              />
              <div className="flex flex-wrap gap-3">
                <button className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary">All Matches</button>
                <button className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary">Match Score</button>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="grid grid-cols-[1.3fr_1.3fr_1fr_1fr_0.8fr_0.9fr] border-b border-border px-6 py-3 text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">
                <span>Company</span>
                <span>Role</span>
                <span>Match Score</span>
                <span>Salary Est.</span>
                <span>Source</span>
                <span>Date Found</span>
              </div>
              <div className="divide-y divide-border">
                {jobs.map((job) => (
                  <div key={`${job.company}-${job.role}`} className="grid grid-cols-[1.3fr_1.3fr_1fr_1fr_0.8fr_0.9fr] items-center px-6 py-4 text-[14px] text-text-primary hover:bg-surface-secondary">
                    <span className="font-medium">{job.company}</span>
                    <span>{job.role}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-16 rounded-full bg-border">
                        <div className={`h-1.5 rounded-full ${scoreBar(job.score)}`} style={{ width: `${job.score}%` }} />
                      </div>
                      <span className="font-medium">{job.score}%</span>
                    </div>
                    <span className="text-text-secondary">{job.salary}</span>
                    <span>
                      <span className={`inline-flex rounded-full px-2 py-1 text-[12px] font-medium ${job.source === "Search" ? "bg-success-lightest text-success-foreground" : "bg-surface-secondary text-text-secondary"}`}>
                        {job.source}
                      </span>
                    </span>
                    <span className="text-text-muted">{job.dateFound}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-sm text-text-secondary">
              <span>Showing 1 to 6 of 24 results</span>
              <div className="flex items-center gap-2">
                <button className="rounded-md border border-border bg-surface px-3 py-2">Previous</button>
                <button className="rounded-md border border-border bg-accent px-3 py-2 text-accent-foreground">1</button>
                <button className="rounded-md border border-border bg-surface px-3 py-2">2</button>
                <button className="rounded-md border border-border bg-surface px-3 py-2">3</button>
                <button className="rounded-md border border-border bg-surface px-3 py-2">Next</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
