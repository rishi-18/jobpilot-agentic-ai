import Image from "next/image";
import Link from "next/link";

import { createInsforgeServer } from "@/lib/insforge-server";

type Feature = {
  title: string;
  description: string;
};

type MatchRow = {
  company: string;
  score: string;
  salary: string;
  source: string;
  tone: "success" | "info" | "warning";
};

type TimelineItem = {
  title: string;
  description: string;
  tone: "accent" | "info" | "success";
};

const features: Feature[] = [
  {
    title: "Find jobs that actually fit",
    description:
      "Search by title and location, then get matched roles you can quickly scan.",
  },
  {
    title: "Know the company before you apply",
    description:
      "JobPilot browses company sites and gives you everything you need to apply with confidence.",
  },
  {
    title: "Keep track of every application",
    description:
      "Keep a clear view of every job you’ve found, tailored, and researched in one simple place.",
  },
];

const matchRows: MatchRow[] = [
  {
    company: "Vercel",
    score: "94%",
    salary: "$180k - $220k",
    source: "LinkedIn",
    tone: "success",
  },
  {
    company: "Stripe",
    score: "88%",
    salary: "$190k - $240k",
    source: "URL",
    tone: "info",
  },
  {
    company: "Linear",
    score: "96%",
    salary: "$150k - $190k",
    source: "LinkedIn",
    tone: "success",
  },
  {
    company: "Notion",
    score: "72%",
    salary: "$140k - $180k",
    source: "LinkedIn",
    tone: "warning",
  },
  {
    company: "OpenAI",
    score: "91%",
    salary: "$200k - $260k",
    source: "LinkedIn",
    tone: "success",
  },
  {
    company: "Figma",
    score: "85%",
    salary: "$170k - $220k",
    source: "URL",
    tone: "info",
  },
];

const timeline: TimelineItem[] = [
  {
    title: "Found 8 jobs for Frontend Engineer",
    description: "10 mins ago",
    tone: "accent",
  },
  {
    title: "Researched Stripe",
    description: "1 hour ago",
    tone: "info",
  },
  {
    title: "Found 6 jobs for React Developer",
    description: "2 hours ago",
    tone: "success",
  },
  {
    title: "Researched Vercel",
    description: "Yesterday",
    tone: "accent",
  },
];

function toneClasses(tone: MatchRow["tone"] | TimelineItem["tone"]): string {
  switch (tone) {
    case "success":
      return "bg-success-light text-success-dark ring-success-light";
    case "info":
      return "bg-info-light text-info-dark ring-info-light";
    case "warning":
      return "bg-warning/15 text-warning ring-warning/20";
    case "accent":
    default:
      return "bg-accent-light text-accent ring-accent-light";
  }
}

export default async function Home() {
  const insforge = await createInsforgeServer();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();
  const authHref = user ? "/dashboard" : "/login";

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-8 pb-8">
        <header className="flex h-20 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur-sm">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground shadow-[0_8px_24px_rgba(124,92,252,0.24)]">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
                <path
                  d="M5 6.75C5 5.23122 6.23122 4 7.75 4H10.25C11.7688 4 13 5.23122 13 6.75V9.25C13 10.7688 11.7688 12 10.25 12H7.75C6.23122 12 5 10.7688 5 9.25V6.75Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M11 14.75C11 13.2312 12.2312 12 13.75 12H16.25C17.7688 12 19 13.2312 19 14.75V17.25C19 18.7688 17.7688 20 16.25 20H13.75C12.2312 20 11 18.7688 11 17.25V14.75Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
            </span>
            <span className="text-[19px] font-semibold tracking-[-0.03em] text-text-darkest">
              JobPilot
            </span>
          </Link>

          <nav className="flex items-center gap-12 text-sm font-medium text-text-dark">
            <Link href="/dashboard" className="transition-colors hover:text-accent">
              Dashboard
            </Link>
            <Link href="/find-jobs" className="transition-colors hover:text-accent">
              Find Jobs
            </Link>
            <Link href="/profile" className="transition-colors hover:text-accent">
              Profile
            </Link>
          </nav>

          <Link
            href={authHref}
            className="inline-flex items-center rounded-md bg-overlay px-4 py-2 text-sm font-medium text-surface shadow-sm transition-colors hover:bg-overlay/90"
          >
            Start for free
          </Link>
        </header>

        <section className="border-x border-border bg-surface px-8 pt-10">
          <div className="relative overflow-hidden border border-border bg-surface px-6 pb-12 pt-12 text-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--color-accent-light)_0,transparent_38%),radial-gradient(circle_at_top_right,var(--color-info-light)_0,transparent_38%),radial-gradient(circle_at_bottom_left,var(--color-accent-light)_0,transparent_24%),radial-gradient(circle_at_bottom_right,var(--color-info-light)_0,transparent_24%)] opacity-70" />
            <div className="relative mx-auto flex max-w-3xl flex-col items-center">
              <h1 className="max-w-4xl text-[58px] font-semibold leading-[0.96] tracking-[-0.06em] text-text-slate">
                Job hunting is hard.
                <br />
                Your tools shouldn’t be.
              </h1>
              <p className="mt-6 max-w-2xl text-[15px] leading-7 text-text-secondary">
                Stop applying blind. JobPilot finds the jobs, researches the companies, and gives you everything you need to stand out.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <Link
                  href={authHref}
                  className="inline-flex items-center gap-2 rounded-md bg-overlay px-4 py-2 text-sm font-medium text-surface shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-overlay/90"
                >
                  Get Started
                  <span aria-hidden="true">▶</span>
                </Link>
                <Link
                  href={authHref}
                  className="inline-flex items-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-surface-secondary"
                >
                  Find Your First Match
                </Link>
              </div>
            </div>
          </div>

          <div className="relative -mt-2 overflow-hidden rounded-t-3xl border border-border bg-surface pt-6 shadow-[0_20px_60px_rgba(17,24,39,0.12)]">
            <div className="px-6 pb-2">
              <div className="rounded-full border border-border bg-surface-secondary px-4 py-2 text-center text-[13px] font-medium text-text-muted">
                <span className="inline-flex items-center gap-2">
                  <span className="size-4 rounded-full border border-border bg-surface" />
                  jobpilot.ai/dashboard
                </span>
              </div>
            </div>
            <div className="border-t border-border bg-background px-6 pb-8 pt-10">
              <div className="rounded-[28px] border border-border bg-surface p-6 shadow-[0_30px_80px_rgba(17,24,39,0.12)]">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <Link href="/" className="flex items-center gap-3">
                    <span className="grid size-7 place-items-center rounded-lg bg-accent text-[13px] font-semibold text-accent-foreground">
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
                        <path d="M5 6.75C5 5.23122 6.23122 4 7.75 4H10.25C11.7688 4 13 5.23122 13 6.75V9.25C13 10.7688 11.7688 12 10.25 12H7.75C6.23122 12 5 10.7688 5 9.25V6.75Z" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M11 14.75C11 13.2312 12.2312 12 13.75 12H16.25C17.7688 12 19 13.2312 19 14.75V17.25C19 18.7688 17.7688 20 16.25 20H13.75C12.2312 20 11 18.7688 11 17.25V14.75Z" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    </span>
                    <span className="font-semibold text-text-darkest">JobPilot</span>
                  </Link>
                  <div className="flex items-center gap-8 text-sm font-medium text-text-dark">
                    <span className="border-b-2 border-accent pb-2 text-accent">Dashboard</span>
                    <span className="pb-2">Find Jobs</span>
                    <span className="pb-2">Profile</span>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Total Jobs Found", value: "284", delta: "+12%", note: "vs last week" },
                    { label: "Avg. Match Rate", value: "82%", delta: "+3%", note: "vs last week" },
                    { label: "Companies Researched", value: "35", delta: null, note: "Total researched" },
                    { label: "Jobs This Week", value: "28", delta: null, note: "New this week" },
                  ].map((item) => (
                    <article key={item.label} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                      <p className="text-[15px] font-medium text-text-secondary">{item.label}</p>
                      <p className="mt-3 text-[42px] font-semibold leading-none tracking-[-0.06em] text-text-primary">
                        {item.value}
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        {item.delta ? (
                          <span className="rounded-md bg-success-lightest px-2 py-1 text-xs font-medium text-success-darker">
                            {item.delta}
                          </span>
                        ) : (
                          <span className="h-6 w-6 rounded-md bg-surface-secondary" />
                        )}
                        <span className="text-sm text-text-muted">{item.note}</span>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_1fr]">
                  <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                    <div className="border-b border-border px-6 py-5 text-[20px] font-semibold text-text-primary">
                      Recent Activity
                    </div>
                    <div className="px-6 py-6">
                      <div className="space-y-6">
                        {timeline.map((item) => (
                          <div key={item.title} className="flex items-start gap-4">
                            <span className={`mt-1 flex size-4 shrink-0 items-center justify-center rounded-full ring-4 ${toneClasses(item.tone)}`}>
                              <span className="size-2 rounded-full bg-current" />
                            </span>
                            <div>
                              <p className="text-[15px] font-medium text-text-primary">{item.title}</p>
                              <p className="mt-1 text-[13px] text-text-muted">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                    <div className="border-b border-border px-6 py-5 text-[20px] font-semibold text-text-primary">
                      Company Research Activity
                    </div>
                    <div className="flex h-[290px] items-end gap-5 px-8 pb-8 pt-16">
                      {[2, 5, 3, 8, 12, 4, 1].map((height, index) => (
                        <div key={`bar-${index}`} className="flex h-full flex-1 items-end">
                          <div
                            className="w-full rounded-t-md bg-info-medium"
                            style={{ height: `${height * 18}px` }}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-x border-border bg-surface px-8 py-10">
          <div className="grid gap-0 overflow-hidden border border-border bg-surface lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-border px-8 py-16 lg:border-b-0 lg:border-r">
              <h2 className="max-w-sm text-[36px] font-semibold leading-[0.98] tracking-[-0.06em] text-text-slate">
                Manage Your Job Search With Ease
              </h2>
              <div className="mt-14 space-y-0 divide-y divide-border">
                {features.map((feature) => (
                  <div key={feature.title} className="py-6 first:pt-0 last:pb-0">
                    <h3 className="text-[18px] font-semibold tracking-[-0.04em] text-text-primary">
                      {feature.title}
                    </h3>
                    <p className="mt-3 max-w-md text-[15px] leading-7 text-text-secondary">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-secondary px-8 py-8">
              <div className="overflow-hidden rounded-2xl border border-border bg-surface p-3 shadow-[0_16px_40px_rgba(17,24,39,0.10)]">
                <div className="grid grid-cols-[1.6fr_0.9fr_0.9fr_0.8fr] border-b border-border px-3 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-text-secondary">
                  <span>Company</span>
                  <span>Match Score</span>
                  <span>Salary Est.</span>
                  <span>Source</span>
                </div>
                <div className="divide-y divide-border">
                  {matchRows.map((row) => (
                    <div
                      key={row.company}
                      className="grid grid-cols-[1.6fr_0.9fr_0.9fr_0.8fr] items-center px-3 py-4 text-[14px] font-medium text-text-primary hover:bg-surface-secondary"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid size-6 place-items-center rounded-md border border-border bg-surface-secondary text-[11px] text-text-muted">
                          ⌁
                        </span>
                        <span>{row.company}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`h-1.5 w-14 rounded-full ${row.tone === "warning" ? "bg-warning" : row.tone === "info" ? "bg-info-medium" : "bg-success"}`} />
                        <span>{row.score}</span>
                      </div>
                      <span className="text-text-secondary">{row.salary}</span>
                      <span>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[12px] font-medium ${
                            row.source === "LinkedIn"
                              ? "bg-linkedin-light text-linkedin"
                              : "bg-surface-secondary text-text-secondary"
                          }`}
                        >
                          {row.source}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-x border-border bg-surface px-8 py-10">
          <div className="grid overflow-hidden border border-border bg-surface lg:grid-cols-[1fr_1.1fr]">
            <div className="border-b border-border bg-background px-8 py-10 lg:border-b-0 lg:border-r">
              <div className="overflow-hidden rounded-[18px] border border-border bg-overlay p-0 shadow-[0_20px_50px_rgba(17,24,39,0.24)]">
                <div className="flex items-center gap-2 border-b border-white/10 bg-overlay px-4 py-3">
                  <span className="size-3 rounded-full bg-error" />
                  <span className="size-3 rounded-full bg-warning" />
                  <span className="size-3 rounded-full bg-success-alt" />
                  <span className="ml-2 text-[12px] font-medium text-surface/90">agent_log.ts</span>
                </div>
                <div className="bg-overlay px-5 py-6 font-mono text-[14px] leading-8 text-surface/90">
                  <div className="grid grid-cols-[28px_1fr] gap-4">
                    <span className="text-text-muted">1</span>
                    <p><span className="text-accent">[SYSTEM]</span> Initializing JobPilot Agent...</p>
                    <span className="text-text-muted">2</span>
                    <p><span className="text-info">[SCAN]</span> Found 14 matching roles</p>
                    <span className="text-text-muted">3</span>
                    <p>↳ Filtered out 3 roles (below salary cap)</p>
                    <span className="text-text-muted">4</span>
                    <p><span className="text-success">[ACTION]</span> Tailoring resume for Stripe (Frontend)</p>
                    <span className="text-text-muted">5</span>
                    <p><span className="text-warning">...</span> Generating cover letter</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-16">
              <h2 className="max-w-md text-[36px] font-semibold leading-[1.02] tracking-[-0.06em] text-text-slate">
                Apply With More Confidence, Every Time
              </h2>
              <div className="mt-10 max-w-lg space-y-8">
                <div>
                  <h3 className="text-[18px] font-semibold tracking-[-0.04em] text-text-primary">
                    Understand your match score
                  </h3>
                  <p className="mt-3 text-[15px] leading-7 text-text-secondary">
                    See how your profile lines up with each role before you apply. Get a clear breakdown of what fits and what&apos;s missing.
                  </p>
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold tracking-[-0.04em] text-text-primary">
                    AI-Powered Job Matching
                  </h3>
                  <p className="mt-3 text-[15px] leading-7 text-text-secondary">
                    Stop guessing which jobs are worth applying to. JobPilot scores every role against your actual skills so you focus on the ones that matter.
                  </p>
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold tracking-[-0.04em] text-text-primary">
                    Focus on the right roles
                  </h3>
                  <p className="mt-3 text-[15px] leading-7 text-text-secondary">
                    Filter out low fit jobs and stay on the ones that actually matter. Spend less time sorting and more time applying.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-x border-border bg-surface px-8 py-14">
          <div className="border border-border bg-surface py-14 text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-accent">
              Success Stories
            </p>
            <blockquote className="mx-auto mt-6 max-w-4xl text-[28px] font-medium leading-[1.45] tracking-[-0.04em] text-text-primary">
              “I used to spend my evenings copy-pasting resumes. Now I open my dashboard to see interviews waiting. It feels like cheating. Had 3 offers on the table simultaneously.”
            </blockquote>
            <div className="mt-6 inline-flex items-center gap-3">
              <Image
                src="/images/user-icon.png"
                alt="Tom Wilson"
                width={40}
                height={40}
                className="size-10 rounded-md object-cover"
              />
              <div className="text-left">
                <p className="text-[14px] font-semibold text-text-primary">Tom Wilson</p>
                <p className="text-[12px] text-text-muted">Junior Developer</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-x border-border bg-surface px-8 py-10">
          <div className="relative overflow-hidden border border-border bg-surface px-6 py-14 text-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--color-accent-light)_0,transparent_38%),radial-gradient(circle_at_top_right,var(--color-info-light)_0,transparent_38%),radial-gradient(circle_at_bottom_left,var(--color-accent-light)_0,transparent_24%),radial-gradient(circle_at_bottom_right,var(--color-info-light)_0,transparent_24%)] opacity-70" />
            <div className="relative">
              <h2 className="mx-auto max-w-4xl text-[42px] font-semibold leading-[1.02] tracking-[-0.06em] text-text-slate">
                Your next job search can feel a lot less overwhelming
              </h2>
              <p className="mt-5 text-[15px] leading-7 text-text-secondary">
                Set up your profile, upload your resume, and start finding matches in minutes.
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <Link
                  href={authHref}
                  className="inline-flex items-center gap-2 rounded-md bg-overlay px-4 py-2 text-sm font-medium text-surface shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-overlay/90"
                >
                  Get Started
                  <span aria-hidden="true">▶</span>
                </Link>
                <Link
                  href={authHref}
                  className="inline-flex items-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-surface-secondary"
                >
                  Find Your First Match
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-x border-b border-border bg-surface px-8 py-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
                  <path d="M5 6.75C5 5.23122 6.23122 4 7.75 4H10.25C11.7688 4 13 5.23122 13 6.75V9.25C13 10.7688 11.7688 12 10.25 12H7.75C6.23122 12 5 10.7688 5 9.25V6.75Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M11 14.75C11 13.2312 12.2312 12 13.75 12H16.25C17.7688 12 19 13.2312 19 14.75V17.25C19 18.7688 17.7688 20 16.25 20H13.75C12.2312 20 11 18.7688 11 17.25V14.75Z" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </span>
              <span className="text-[19px] font-semibold tracking-[-0.03em] text-text-darkest">
                JobPilot
              </span>
            </Link>
            <div className="flex items-center gap-10 text-sm text-text-dark">
              <Link href="/dashboard" className="transition-colors hover:text-accent">
                Dashboard
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-accent">
                Privacy Policy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-accent">
                Terms &amp; Conditions
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
