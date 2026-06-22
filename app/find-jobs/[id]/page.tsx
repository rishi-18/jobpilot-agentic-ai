import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import OpenAI from "openai";

import { createInsforgeServer } from "@/lib/insforge-server";
import { UserSessionSync } from "../../user-session-sync";
import { NavbarAccountButton } from "../../navbar-account-button";
import { ResearchButton } from "./research-button";

type JobDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type CompanyResearchDossier = {
  companyOverview?: string;
  techStack?: string[];
  culture?: string[];
  whyThisRole?: string;
  yourEdge?: string[];
  gapsToAddress?: string[];
  smartQuestions?: string[];
  interviewPrep?: string[];
  sources?: string[];
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
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

function getMatchScoreStyle(score: number): string {
  if (score >= 90) return "bg-success-lightest text-success-foreground border border-success-light";
  if (score >= 70) return "bg-success-light text-success-dark";
  if (score >= 50) return "bg-warning/10 text-warning";
  return "bg-surface-secondary text-text-muted";
}

function formatJobType(type: string | null): string {
  if (!type) return "—";
  if (type === "fulltime") return "Full-time";
  if (type === "parttime") return "Part-time";
  if (type === "contract") return "Contract";
  return type;
}

async function getFullDescription(
  jobId: string,
  url: string,
  currentDescription: string | null
): Promise<string> {
  const desc = currentDescription || "";
  if (!desc) return "";

  // Check if it looks truncated (ends with ellipsis or is unusually short)
  const isTruncated = desc.endsWith("...") || desc.endsWith("…") || desc.length < 350;
  if (!isTruncated) {
    return desc;
  }

  console.log(`[description-sync] Job ${jobId} description seems truncated. Attempting to fetch full description from ${url}`);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      console.warn(`[description-sync] Fetch failed with status ${res.status} for ${url}`);
      return desc;
    }

    const html = await res.text();

    // Clean HTML to extract text content
    let text = html
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");

    text = text
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (text.length < 200) {
      console.warn(`[description-sync] Extracted text too short (${text.length} chars) from ${url}`);
      return desc;
    }

    const maxChars = 12000;
    const truncatedText = text.length > maxChars ? text.substring(0, maxChars) : text;

    const groqApiKey = process.env.GROK_API_KEY || process.env.GROQ_API_KEY;
    const openai = new OpenAI({
      apiKey: groqApiKey || "",
      baseURL: "https://api.groq.com/openai/v1",
    });

    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a job description extraction assistant. Extract the complete, original job description from the provided web page text. Preserve all paragraphs, responsibilities, requirements, benefits, and list formatting. Do not add any summary, introduction, or commentary. Return ONLY the extracted job description text.",
        },
        {
          role: "user",
          content: `Here is the page text:\n\n${truncatedText}`,
        },
      ],
      temperature: 0.1,
    });

    const extracted = completion.choices[0]?.message?.content?.trim();
    if (extracted && extracted.length > desc.length) {
      console.log(`[description-sync] Successfully extracted full description (${extracted.length} chars) for job ${jobId}`);

      // Save back to the database
      const insforge = await createInsforgeServer();
      await insforge.database
        .from("jobs")
        .update({ about_role: extracted })
        .eq("id", jobId);

      return extracted;
    }
  } catch (error) {
    console.error(`[description-sync] Failed to extract description for job ${jobId}:`, error);
  }

  return desc;
}

export default async function JobDetailsPage({ params }: JobDetailsPageProps) {
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

  const { id } = await params;

  // Fetch job record and ensure it belongs to the authenticated user
  const { data: job, error } = await insforge.database
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !job) {
    return notFound();
  }

  // Retrieve full description if currently truncated
  const applyUrl = job.external_apply_url || job.source_url;
  const fullDescription = applyUrl
    ? await getFullDescription(job.id, applyUrl, job.about_role)
    : job.about_role || "";

  const relativeTime = formatRelativeTime(job.found_at);
  const research: CompanyResearchDossier | null = (job.company_research as CompanyResearchDossier) || null;
  const hasResearch = research && Object.keys(research).length > 0;

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
            <Link href="/dashboard" className="transition-colors hover:text-accent">Dashboard</Link>
            <Link href="/find-jobs" className="text-accent">Find Jobs</Link>
            <Link href="/profile" className="transition-colors hover:text-accent">Profile</Link>
          </nav>

          <NavbarAccountButton label={accountLabel} />
        </header>

        {/* Back Link */}
        <div className="mt-8 flex px-4">
          <Link
            href="/find-jobs"
            className="group inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Jobs
          </Link>
        </div>

        {/* Details Content Layout */}
        <section className="mt-6 flex flex-col gap-6 px-4">
          {/* Main Title Header Card */}
          <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-secondary border border-border text-text-muted">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.905 0-5.64-.5-8.157-1.418m15.686 0a11.963 11.963 0 00-2.225-5.555M5.572 8.575a11.963 11.963 0 012.225-5.555"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">{job.title}</h1>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-text-dark">{job.company}</span>
                  <span className="text-text-muted">•</span>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${getMatchScoreStyle(job.match_score || 0)}`}>
                    {job.match_score}% Match Score
                  </span>
                </div>
              </div>
            </div>

            {(job.external_apply_url || job.source_url) && (
              <div>
                <a
                  href={job.external_apply_url || job.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text-primary shadow-sm transition-colors hover:bg-surface-secondary"
                >
                  View Job Post
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Salary */}
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-lightest text-success">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="space-y-0.5">
                <p className="text-base font-semibold text-text-primary">{job.salary || "N/A"}</p>
                <p className="text-xs uppercase tracking-wider text-text-muted">Salary Est.</p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info-lightest text-info-foreground">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="space-y-0.5">
                <p className="text-base font-semibold text-text-primary">{job.location || "Remote"}</p>
                <p className="text-xs uppercase tracking-wider text-text-muted">Location</p>
              </div>
            </div>

            {/* Job Type */}
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light text-accent">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="space-y-0.5">
                <p className="text-base font-semibold text-text-primary">{formatJobType(job.job_type)}</p>
                <p className="text-xs uppercase tracking-wider text-text-muted">Job Type</p>
              </div>
            </div>

            {/* Date Found */}
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-secondary text-text-secondary border border-border">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="space-y-0.5">
                <p className="text-base font-semibold text-text-primary">{relativeTime}</p>
                <p className="text-xs uppercase tracking-wider text-text-muted">Date Found</p>
              </div>
            </div>
          </div>

          {/* AI Match Reasoning */}
          {job.match_reason && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-success" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">AI Match Reasoning</h2>
              </div>
              <p className="text-sm font-medium leading-relaxed text-text-primary">{job.match_reason}</p>
            </div>
          )}

          {/* Skills Breakdown */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary border-b border-border pb-3">
              Required Skills vs Your Profile
            </h2>

            {/* Matched Skills */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-text-dark">You have</p>
              <div className="flex flex-wrap gap-2">
                {job.matched_skills && job.matched_skills.length > 0 ? (
                  job.matched_skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full bg-success-lightest px-3 py-1 text-xs font-semibold text-success-foreground border border-success-light"
                    >
                      <svg className="h-3 w-3 text-success-dark" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-text-muted">No matching skills identified.</span>
                )}
              </div>
            </div>

            {/* Gap Skills */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-text-dark">Gap skills</p>
              <div className="flex flex-wrap gap-2">
                {job.missing_skills && job.missing_skills.length > 0 ? (
                  job.missing_skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-3 py-1 text-xs font-semibold text-accent border border-accent-light"
                    >
                      <svg className="h-3 w-3 text-accent" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-success font-medium">None! You possess all required skills for this job.</span>
                )}
              </div>
            </div>
          </div>

          {/* Job Description Card */}
          {fullDescription && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <svg className="h-5 w-5 text-text-secondary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h2 className="text-base font-semibold text-text-primary">Job Description</h2>
              </div>
              <div className="whitespace-pre-line text-sm font-medium leading-relaxed text-text-primary">
                {fullDescription}
              </div>
            </div>
          )}

          {/* Company Research Dossier Card */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <h2 className="text-base font-semibold text-text-primary">Company Research</h2>
              </div>

              {!hasResearch && (
                <ResearchButton jobId={job.id} />
              )}
            </div>

            {hasResearch && research ? (
              <div className="space-y-6">
                {/* Overview */}
                {research.companyOverview && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-text-dark">Overview</h3>
                    <p className="text-sm text-text-primary leading-relaxed">{research.companyOverview}</p>
                  </div>
                )}

                {/* Tech Stack */}
                {research.techStack && research.techStack.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-text-dark">Tech Stack</h3>
                    <div className="flex flex-wrap gap-2">
                      {research.techStack.map((tech) => (
                        <span key={tech} className="inline-flex rounded-md bg-surface-secondary border border-border px-2.5 py-1 text-xs font-semibold text-text-dark">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Culture */}
                {research.culture && research.culture.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-text-dark">Company Culture</h3>
                    <ul className="list-disc pl-5 text-sm text-text-primary space-y-1.5">
                      {research.culture.map((c, idx) => (
                        <li key={idx} className="leading-relaxed">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Why This Role */}
                {research.whyThisRole && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-text-dark">Why This Role</h3>
                    <p className="text-sm text-text-primary leading-relaxed">{research.whyThisRole}</p>
                  </div>
                )}

                {/* Your Edge */}
                {research.yourEdge && research.yourEdge.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-text-dark">Your Edge</h3>
                    <ul className="list-disc pl-5 text-sm text-text-primary space-y-1.5">
                      {research.yourEdge.map((edge, idx) => (
                        <li key={idx} className="leading-relaxed">{edge}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Gaps to Address */}
                {research.gapsToAddress && research.gapsToAddress.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-text-dark">Gaps to Address</h3>
                    <ul className="list-disc pl-5 text-sm text-text-primary space-y-1.5">
                      {research.gapsToAddress.map((gap, idx) => (
                        <li key={idx} className="leading-relaxed">{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Smart Questions */}
                {research.smartQuestions && research.smartQuestions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-text-dark">Smart Questions for Interview</h3>
                    <ul className="list-disc pl-5 text-sm text-text-primary space-y-1.5">
                      {research.smartQuestions.map((q, idx) => (
                        <li key={idx} className="leading-relaxed">{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Interview Prep */}
                {research.interviewPrep && research.interviewPrep.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-text-dark">Interview Prep Strategy</h3>
                    <ul className="list-disc pl-5 text-sm text-text-primary space-y-1.5">
                      {research.interviewPrep.map((prep, idx) => (
                        <li key={idx} className="leading-relaxed">{prep}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sources */}
                {research.sources && research.sources.length > 0 && (
                  <div className="space-y-2 border-t border-border pt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Sources</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                      {research.sources.map((src, idx) => (
                        <a key={idx} href={src} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors underline break-all">
                          {src}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xl bg-surface-secondary">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-border-light text-text-muted mb-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-text-primary">No research yet</p>
                <p className="mt-1 text-xs text-text-muted max-w-sm px-4">
                  Click &ldquo;Research Company&rdquo; to let the AI browse {job.company}&rsquo;s public pages and build a dossier.
                </p>
              </div>
            )}
          </div>

          {/* Apply Now Primary Action Bar */}
          {(job.external_apply_url || job.source_url) && (
            <div className="mt-4 flex">
              <a
                href={job.external_apply_url || job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center rounded-md bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-dark"
              >
                Apply Now at {job.company}
              </a>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
