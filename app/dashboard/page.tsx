import Link from "next/link";
import { redirect } from "next/navigation";

import { createInsforgeServer } from "@/lib/insforge-server";
import { NavbarAccountButton } from "@/app/navbar-account-button";
import { UserSessionSync } from "@/app/user-session-sync";
import { Interactive3DCard } from "@/components/dashboard/Interactive3DCard";
import {
  CompanyResearchChart,
  JobsFoundChart,
  MatchScoreChart,
} from "@/components/dashboard/DashboardCharts";

type StatCard = {
  label: string;
  value: string;
  delta?: string;
  note: string;
  showDelta: boolean;
};

type ActivityItem = {
  id: string;
  title: string;
  time: string;
  type: "accent" | "info" | "success";
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    if (diffMins <= 1) return "just now";
    return `${diffMins} minutes ago`;
  }
  if (diffHours < 24) {
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hours ago`;
  }
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function getTimelineDotStyle(type: ActivityItem["type"]) {
  switch (type) {
    case "accent":
      return { outer: "bg-accent-light", inner: "bg-accent" };
    case "info":
      return { outer: "bg-info-light", inner: "bg-info" };
    case "success":
      return { outer: "bg-success-light", inner: "bg-success" };
  }
}

export default async function DashboardPage() {
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

  // Fetch the profile completion status
  const { data: profile } = await insforge.database
    .from("profiles")
    .select("is_complete")
    .eq("id", user.id)
    .single();

  const isProfileComplete = !!profile?.is_complete;

  // Fetch real database records for stats metrics
  let dbJobs: any[] = [];
  try {
    const { data, error: dbErr } = await insforge.database
      .from("jobs")
      .select("match_score, company_research, found_at")
      .eq("user_id", user.id);
    if (dbErr) {
      console.error("[Dashboard] Error fetching jobs stats:", dbErr);
    } else {
      dbJobs = data || [];
    }
  } catch (err) {
    console.error("[Dashboard] Unexpected error fetching jobs stats:", err);
  }

  const totalJobsVal = dbJobs.length;

  // Calculate Avg Match Rate (only count jobs with valid numeric match_score)
  let avgMatchRateVal = 0;
  if (dbJobs.length > 0) {
    const scores = dbJobs.map((j) => j.match_score).filter((s) => typeof s === "number");
    if (scores.length > 0) {
      avgMatchRateVal = Math.round(scores.reduce((acc, val) => acc + val, 0) / scores.length);
    }
  }

  // Calculate Companies Researched (company_research is not null)
  const researchedCountVal = dbJobs.filter((j) => j.company_research !== null).length;

  // Calculate Jobs This Week (rolling last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const jobsThisWeekVal = dbJobs.filter((j) => {
    const date = new Date(j.found_at);
    return date >= sevenDaysAgo;
  }).length;

  const stats: StatCard[] = [
    { label: "Total Jobs Found", value: String(totalJobsVal), note: "Total tracked", showDelta: false },
    { label: "Avg. Match Rate", value: `${avgMatchRateVal}%`, note: "Average score", showDelta: false },
    { label: "Companies Researched", value: String(researchedCountVal), note: "Total researched", showDelta: false },
    { label: "Jobs This Week", value: String(jobsThisWeekVal), note: "New in last 7 days", showDelta: false },
  ];

  // Fetch recent agent runs
  let recentRuns: any[] = [];
  try {
    const { data, error } = await insforge.database
      .from("agent_runs")
      .select("id, job_title_searched, jobs_found, started_at, status")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(10);
    if (!error) {
      recentRuns = data || [];
    }
  } catch (err) {
    console.error("[Dashboard] Error fetching recent agent runs:", err);
  }

  // Fetch recent jobs with company research
  let researchedJobs: any[] = [];
  try {
    const { data, error } = await insforge.database
      .from("jobs")
      .select("id, company, found_at")
      .eq("user_id", user.id)
      .not("company_research", "is", null)
      .order("found_at", { ascending: false })
      .limit(10);
    if (!error) {
      researchedJobs = data || [];
    }
  } catch (err) {
    console.error("[Dashboard] Error fetching researched jobs:", err);
  }

  // Merge and sort activities chronologically (descending)
  const activities: (ActivityItem & { timestamp: Date })[] = [];

  recentRuns.forEach((run) => {
    activities.push({
      id: `run-${run.id}`,
      title: `Found ${run.jobs_found} jobs for ${run.job_title_searched}`,
      time: formatRelativeTime(new Date(run.started_at)),
      type: "success",
      timestamp: new Date(run.started_at),
    });
  });

  researchedJobs.forEach((job) => {
    activities.push({
      id: `job-${job.id}`,
      title: `Researched ${job.company}`,
      time: formatRelativeTime(new Date(job.found_at)),
      type: "info",
      timestamp: new Date(job.found_at),
    });
  });

  // Sort activities by timestamp descending and take the top 5
  const sortedActivities = activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);

  // Compute 1. Company Research Activity (last 7 days)
  const last7Days: { dayName: string; dateKey: string; count: number }[] = [];
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push({
      dayName: weekdayNames[d.getDay()],
      dateKey: d.toISOString().split("T")[0],
      count: 0,
    });
  }

  dbJobs.forEach((job) => {
    if (job.company_research && job.found_at) {
      const jobDateKey = new Date(job.found_at).toISOString().split("T")[0];
      const match = last7Days.find((day) => day.dateKey === jobDateKey);
      if (match) {
        match.count += 1;
      }
    }
  });

  const companyResearchData = last7Days.map((day) => ({
    name: day.dayName,
    value: day.count,
  }));

  // Compute 2. Jobs Found Over Time (last 30 days)
  const last30Days: { dateString: string; dateKey: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last30Days.push({
      dateString: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      dateKey: d.toISOString().split("T")[0],
      count: 0,
    });
  }

  dbJobs.forEach((job) => {
    if (job.found_at) {
      const jobDateKey = new Date(job.found_at).toISOString().split("T")[0];
      const match = last30Days.find((day) => day.dateKey === jobDateKey);
      if (match) {
        match.count += 1;
      }
    }
  });

  const jobsFoundOverTimeData = last30Days.map((day) => ({
    name: day.dateString,
    value: day.count,
  }));

  // Compute 3. Match Score Distribution
  const scoreRanges = [
    { name: "50-60%", min: 50, max: 60, value: 0 },
    { name: "60-70%", min: 60, max: 70, value: 0 },
    { name: "70-80%", min: 70, max: 80, value: 0 },
    { name: "80-90%", min: 80, max: 90, value: 0 },
    { name: "90-100%", min: 90, max: 100, value: 0 },
  ];

  dbJobs.forEach((job) => {
    const score = job.match_score;
    if (typeof score === "number") {
      const range = scoreRanges.find(
        (r) => (score >= r.min && score < r.max) || (r.max === 100 && score === 100)
      );
      if (range) {
        range.value += 1;
      }
    }
  });

  const matchScoreDistributionData = scoreRanges.map((r) => ({
    name: r.name,
    value: r.value,
  }));

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <UserSessionSync user={sessionUser} />
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-8 pb-16">
        <header className="flex h-20 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground shadow-[0_8px_24px_rgba(124,92,252,0.24)]">
              <span className="text-sm font-semibold">J</span>
            </span>
            <span className="text-[19px] font-semibold tracking-[-0.03em] text-text-darkest">JobPilot</span>
          </div>

          <nav className="flex items-center gap-12 text-sm font-medium text-text-dark">
            <Link href="/dashboard" className="text-accent">Dashboard</Link>
            <Link href="/find-jobs" className="transition-colors hover:text-accent">Find Jobs</Link>
            <Link href="/profile" className="transition-colors hover:text-accent">Profile</Link>
          </nav>

          <NavbarAccountButton label={accountLabel} />
        </header>

        {/* Dashboard Content Container */}
        <section className="mt-8 flex flex-col gap-6 px-4">
          {/* Profile Completion Alert Banner */}
          {!isProfileComplete && (
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-accent-muted px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-accent">
                  Profile needs attention
                </p>
                <p className="text-sm leading-6 text-text-secondary">
                  Complete phone number, location, and education to unlock better job matching.
                </p>
              </div>
              <div>
                <Link
                  href="/profile"
                  className="inline-flex rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent-dark transition-colors"
                >
                  Complete Profile
                </Link>
              </div>
            </div>
          )}

          {/* Metric Stats Cards Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between min-h-[148px]"
              >
                <div>
                  <p className="text-[14px] font-semibold text-text-secondary">{stat.label}</p>
                  <p className="mt-2.5 text-[32px] font-bold leading-none tracking-[-0.04em] text-text-primary">
                    {stat.value}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {stat.showDelta && stat.delta && (
                    <span className="rounded-sm bg-success-lightest px-2 py-0.5 text-xs font-semibold text-success-darker border border-success-light/30">
                      {stat.delta}
                    </span>
                  )}
                  <span className="text-xs text-text-muted">{stat.note}</span>
                </div>
              </article>
            ))}
          </div>

          {/* First Row: Recent Activity & Company Research Activity */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Activity Card */}
            <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm flex flex-col justify-between">
              <div>
                <div className="border-b border-border px-6 py-5 text-[16px] font-semibold text-text-primary">
                  Recent Activity
                </div>
                <div className="px-6 py-6">
                  {sortedActivities.length === 0 ? (
                    <div className="flex h-[200px] flex-col items-center justify-center text-center">
                      <p className="text-[14px] font-medium text-text-secondary">No activity yet</p>
                      <p className="mt-1 text-xs text-text-muted">
                        Find a few jobs or research a company and it will show up here.
                      </p>
                    </div>
                  ) : (
                    <div className="relative space-y-6">
                      {sortedActivities.map((item, idx) => {
                        const dotStyle = getTimelineDotStyle(item.type);
                        const isLast = idx === sortedActivities.length - 1;

                        return (
                          <div key={item.id} className="relative flex gap-4">
                            {/* Timeline vertical connector */}
                            {!isLast && (
                              <span
                                className="absolute left-[8px] top-[18px] bottom-[-24px] w-[2px] bg-border"
                                aria-hidden="true"
                              />
                            )}

                            {/* Outer timeline dot wrapper */}
                            <span className="relative z-10 flex size-[18px] items-center justify-center rounded-full bg-surface">
                              <span
                                className={`flex size-4 items-center justify-center rounded-full ${dotStyle.outer}`}
                              >
                                <span className={`size-2 rounded-full ${dotStyle.inner}`} />
                              </span>
                            </span>

                            <div className="space-y-0.5">
                              <p className="text-[14px] font-semibold leading-relaxed text-text-primary">
                                {item.title}
                              </p>
                              <p className="text-[12px] text-text-muted">{item.time}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </article>

            {/* Company Research Activity Bar Chart */}
            <CompanyResearchChart data={companyResearchData} />
          </div>

          {/* Second Row: Jobs Found Over Time (2/3) & Match Score Distribution (1/3) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Jobs Found Over Time Area Line Chart */}
            <div className="lg:col-span-2">
              <JobsFoundChart data={jobsFoundOverTimeData} />
            </div>

            {/* Match Score Distribution Bar Chart */}
            <div className="lg:col-span-1">
              <MatchScoreChart data={matchScoreDistributionData} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
