import Link from "next/link";
import { redirect } from "next/navigation";

import { createInsforgeServer } from "@/lib/insforge-server";

import { NavbarAccountButton } from "../navbar-account-button";
import { UserSessionSync } from "../user-session-sync";
import { SearchControls } from "./search-controls";
import { FilterControls, PaginationControls } from "./filter-controls";

type JobRow = {
  id: string;
  company: string;
  role: string;
  score: number;
  salary: string;
  source: string;
  dateFound: string;
};

type FindJobsPageProps = {
  searchParams?: Promise<{
    page?: string;
    sort?: string;
    filter?: string;
    q?: string;
  }>;
};

function scoreBar(score: number): string {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-info-medium";
  return "bg-warning";
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export default async function FindJobsPage({ searchParams }: FindJobsPageProps) {
  const insforge = await createInsforgeServer();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const sessionUser = {
    id: user.id,
    email: user.email ?? null,
    name: user.profile?.name ?? null,
  };
  const accountLabel = sessionUser.name?.trim() || sessionUser.email || "Account";

  // Parse search params
  const params = await searchParams;
  const page = parseInt(params?.page || "1", 10);
  const sort = params?.sort || "newest";
  const filter = params?.filter || "all";
  const q = params?.q || "";

  const pageSize = 20;

  // Build the database query
  let dbQuery = insforge.database
    .from("jobs")
    .select("*", { count: "exact" })
    .eq("user_id", user.id);

  // Apply search filtering
  if (filter === "high") {
    dbQuery = dbQuery.gte("match_score", 70);
  } else if (filter === "low") {
    dbQuery = dbQuery.lt("match_score", 70);
  }

  // Apply text search
  if (q) {
    dbQuery = dbQuery.or(`title.ilike.%${q}%,company.ilike.%${q}%`);
  }

  // Apply sorting
  if (sort === "score") {
    dbQuery = dbQuery
      .order("match_score", { ascending: false })
      .order("found_at", { ascending: false });
  } else if (sort === "oldest") {
    dbQuery = dbQuery.order("found_at", { ascending: true });
  } else {
    dbQuery = dbQuery.order("found_at", { ascending: false });
  }

  // Apply pagination range
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  dbQuery = dbQuery.range(from, to);

  const { data: dbJobs = [], count, error: fetchErr } = await dbQuery;

  if (fetchErr) {
    console.error("[find-jobs] Failed to fetch filtered/paginated jobs:", fetchErr);
  }

  const totalCount = count || 0;

  const jobsList: JobRow[] = (dbJobs || []).map((job: any) => ({
    id: job.id,
    company: job.company,
    role: job.title,
    score: job.match_score || 0,
    salary: job.salary || "N/A",
    source: job.source === "search" ? "Search" : "URL",
    dateFound: formatRelativeTime(job.found_at),
  }));

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
            <SearchControls userId={user.id} />
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <FilterControls />

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
                {jobsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-[15px] font-medium text-text-secondary">No matching jobs found.</p>
                    <p className="mt-1 text-sm text-text-muted">Adjust your filter options or enter a search query above.</p>
                  </div>
                ) : (
                  jobsList.map((job) => (
                    <div key={job.id} className="grid grid-cols-[1.3fr_1.3fr_1fr_1fr_0.8fr_0.9fr] items-center px-6 py-4 text-[14px] text-text-primary hover:bg-surface-secondary">
                      <span className="font-medium">{job.company}</span>
                      <span>
                        <Link href={`/find-jobs/${job.id}`} className="hover:text-accent transition-colors">
                          {job.role}
                        </Link>
                      </span>
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
                  ))
                )}
              </div>
            </div>

            <PaginationControls totalCount={totalCount} currentPage={page} pageSize={pageSize} />
          </div>
        </section>
      </div>
    </main>
  );
}

