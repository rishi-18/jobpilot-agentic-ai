import Link from "next/link";

import { createInsforgeServer } from "@/lib/insforge-server";

import { NavbarAccountButton } from "@/app/navbar-account-button";
import { UserSessionSync } from "@/app/user-session-sync";

type StatCard = {
  label: string;
  value: string;
  delta: string;
  note: string;
};

type ActivityItem = {
  title: string;
  time: string;
  tone: "info" | "success";
};

const stats: StatCard[] = [
  { label: "Total Jobs Found", value: "284", delta: "+12%", note: "vs last week" },
  { label: "Avg. Match Rate", value: "82%", delta: "+3%", note: "vs last week" },
  { label: "Companies Researched", value: "35", delta: "+6", note: "this month" },
  { label: "Jobs This Week", value: "28", delta: "+9", note: "new jobs" },
];

const activity: ActivityItem[] = [
  { title: "Found 8 jobs for Frontend Engineer", time: "10 mins ago", tone: "success" },
  { title: "Researched Stripe", time: "1 hour ago", tone: "info" },
  { title: "Found 6 jobs for React Developer", time: "2 hours ago", tone: "success" },
  { title: "Researched Vercel", time: "Yesterday", tone: "info" },
  { title: "Profile completed", time: "2 days ago", tone: "success" },
];

const jobTrends = [38, 56, 42, 74, 62, 88, 96];
const tailoringTrends = [22, 40, 30, 58, 46, 70, 64];
const distribution = [12, 20, 34, 28, 18];

function toneClasses(tone: ActivityItem["tone"]): string {
  return tone === "success" ? "bg-success-light text-success-darker" : "bg-info-light text-info-dark";
}

export default async function DashboardPage() {
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
            <Link href="/dashboard" className="text-accent">Dashboard</Link>
            <Link href="/find-jobs" className="transition-colors hover:text-accent">Find Jobs</Link>
            <Link href="/profile" className="transition-colors hover:text-accent">Profile</Link>
          </nav>

          <NavbarAccountButton label={accountLabel} />
        </header>

        <section className="border-x border-border bg-surface px-8 py-8">
          <div className="rounded-2xl border border-border bg-accent-muted px-6 py-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-accent">Profile needs attention</p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Complete phone number, location, and education to unlock better job matching.
            </p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <article key={stat.label} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <p className="text-[15px] font-medium text-text-secondary">{stat.label}</p>
                <p className="mt-3 text-[42px] font-semibold leading-none tracking-[-0.06em] text-text-primary">
                  {stat.value}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="rounded-md bg-success-lightest px-2 py-1 text-xs font-medium text-success-darker">
                    {stat.delta}
                  </span>
                  <span className="text-sm text-text-muted">{stat.note}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <div className="border-b border-border px-6 py-5 text-[16px] font-semibold text-text-primary">
                Recent Activity
              </div>
              <div className="px-6 py-6">
                <div className="space-y-5">
                  {activity.map((item) => (
                    <div key={item.title} className="flex items-start gap-4">
                      <span className={`mt-1 size-3 rounded-full ${toneClasses(item.tone)}`} />
                      <div>
                        <p className="text-[14px] font-medium text-text-primary">{item.title}</p>
                        <p className="mt-1 text-[12px] text-text-muted">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <div className="border-b border-border px-6 py-5 text-[16px] font-semibold text-text-primary">
                Jobs Found Over Time
              </div>
              <div className="flex h-[292px] items-end gap-4 px-6 pb-6 pt-12">
                {jobTrends.map((height, index) => (
                  <div key={`job-${index}`} className="flex h-full flex-1 items-end">
                    <div className="w-full rounded-t-md bg-info-medium" style={{ height: `${height}%` }} />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <div className="border-b border-border px-6 py-5 text-[16px] font-semibold text-text-primary">
                Resume Tailoring Activity
              </div>
              <div className="flex h-[260px] items-end gap-4 px-6 pb-6 pt-12">
                {tailoringTrends.map((height, index) => (
                  <div key={`tailor-${index}`} className="flex h-full flex-1 items-end">
                    <div className="w-full rounded-t-md bg-success" style={{ height: `${height}%` }} />
                  </div>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <div className="border-b border-border px-6 py-5 text-[16px] font-semibold text-text-primary">
                Match Score Distribution
              </div>
              <div className="space-y-4 px-6 py-6">
                {[
                  { label: "50-60%", value: distribution[0] },
                  { label: "60-70%", value: distribution[1] },
                  { label: "70-80%", value: distribution[2] },
                  { label: "80-90%", value: distribution[3] },
                  { label: "90-100%", value: distribution[4] },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <span className="w-20 text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">
                      {item.label}
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-border">
                      <div className="h-2 rounded-full bg-accent" style={{ width: `${item.value * 4}%` }} />
                    </div>
                    <span className="w-8 text-right text-[12px] text-text-muted">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}


