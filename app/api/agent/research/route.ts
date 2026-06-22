import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import { URL } from "url";

import { createInsforgeServer } from "@/lib/insforge-server";
import { getPostHogServer, shutdownPostHog } from "@/lib/posthog-server";

// Define parsing validation schemas
const homepageSchema = z.object({
  oneLiner: z.string().describe("What the company does in one sentence").catch(""),
  productSummary: z.string().describe("What they build/sell and who it's for").catch(""),
  signals: z.array(z.string()).describe("Funding, notable customers, scale, mission, recent news").catch([]),
  pageLinks: z
    .array(
      z.object({
        url: z.string(),
        kind: z.enum(["about", "careers", "blog", "engineering", "product", "team", "other"]),
      })
    )
    .describe("Internal links worth visiting")
    .catch([]),
});

const subPageSchema = z.object({
  keyPoints: z.array(z.string()).catch([]),
  technologies: z.array(z.string()).describe("Specific languages, frameworks, tools, platforms").catch([]),
  valuesOrCulture: z.array(z.string()).describe("Stated values, working style, team norms").catch([]),
  notable: z.array(z.string()).describe("Customers, funding, scale, projects, awards").catch([]),
});

const dossierSchema = z.object({
  companyOverview: z.string().catch(""),
  techStack: z.array(z.string()).catch([]),
  culture: z.array(z.string()).catch([]),
  whyThisRole: z.string().catch(""),
  yourEdge: z.array(z.string()).catch([]),
  gapsToAddress: z.array(z.string()).catch([]),
  smartQuestions: z.array(z.string()).catch([]),
  interviewPrep: z.array(z.string()).catch([]),
  sources: z.array(z.string()).catch([]),
});

async function logResearchEvent(userId: string, message: string, level: "info" | "warning" | "error") {
  try {
    const insforge = await createInsforgeServer();
    await insforge.database.from("agent_logs").insert({
      user_id: userId,
      message,
      level,
    });
  } catch (err) {
    console.error("[research-agent] Failed to insert log record:", err);
  }
}

async function resolveHomepage(companyName: string, redirectUrl: string | null): Promise<string> {
  const sanitizedCompany = companyName
    .toLowerCase()
    .replace(/\b(llc|inc|ltd|co|corp|corporation|group|software|technologies|solutions)\b/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();

  const defaultHomepage = `https://www.${sanitizedCompany || "company"}.com`;

  if (!redirectUrl) {
    return defaultHomepage;
  }

  try {
    const res = await fetch(redirectUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return defaultHomepage;
    }

    const finalUrl = res.url;
    if (!finalUrl || finalUrl.includes("adzuna.com")) {
      return defaultHomepage;
    }

    const parsed = new URL(finalUrl);
    const hostParts = parsed.hostname.split(".");
    let domain = parsed.hostname;

    if (hostParts.length > 2) {
      // Strip standard jobs/careers subdomains (e.g. jobs.stripe.com -> stripe.com)
      domain = hostParts.slice(-2).join(".");
    }

    return `https://${domain}`;
  } catch (error) {
    console.error("[research-agent] Failed to follow redirect link, falling back to default domain:", error);
    return defaultHomepage;
  }
}

export async function POST(req: NextRequest) {
  try {
    const insforge = await createInsforgeServer();

    // 1. Authenticate user
    const {
      data: { user },
    } = await insforge.auth.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse payload
    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId in payload" }, { status: 400 });
    }

    // 3. Load job record
    const { data: job, error: jobError } = await insforge.database
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
    }

    // 4. Load profile record
    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });
    }

    await logResearchEvent(user.id, `Starting company research for ${job.company} (Job ID: ${job.id})`, "info");

    // 5. Resolve Company Homepage
    const homepageUrl = await resolveHomepage(job.company, job.external_apply_url || job.source_url);
    console.log(`[research-agent] Resolved homepage to: ${homepageUrl}`);

    // 6. Stagehand Website Crawling (sequential Homepage + max 3 sub-pages)
    let companyResearchData: any = {};
    const visitedUrls: string[] = [];

    const browserbaseApiKey = process.env.BROWSERBASE_API_KEY;
    const browserbaseProjectId = process.env.BROWSERBASE_PROJECT_ID;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (browserbaseApiKey && browserbaseProjectId && openaiApiKey) {
      let stagehand: any = null;
      try {
        // Dynamic imports to prevent build errors if Node packages load out of order
        const { default: Browserbase } = await import("@browserbasehq/sdk");
        const { Stagehand } = await import("@browserbasehq/stagehand");

        const bb = new Browserbase({ apiKey: browserbaseApiKey });
        const session = await bb.sessions.create({
          projectId: browserbaseProjectId,
          timeout: 120, // 2-minute limit
        });

        stagehand = new Stagehand({
          env: "BROWSERBASE",
          apiKey: browserbaseApiKey,
          projectId: browserbaseProjectId,
          browserbaseSessionID: session.id,
          model: { modelName: "openai/gpt-4o", apiKey: openaiApiKey },
          disablePino: true,
        });

        await stagehand.init();
        const page = stagehand.context.activePage()!;

        // Crawl Homepage
        console.log(`[research-agent] Crawling company homepage: ${homepageUrl}`);
        visitedUrls.push(homepageUrl);
        await page.goto(homepageUrl, { waitUntil: "domcontentloaded", timeout: 20000 });

        const homepageDetails = await stagehand.extract({
          instruction:
            "This is a company's homepage. Capture what the company actually does, who it's for, and any concrete signals (funding, customers, scale, mission, recent launches). Then find the internal links most worth visiting to research them as an employer.",
          schema: homepageSchema,
        });

        const parsedHomepage = homepageSchema.parse(homepageDetails);

        if (parsedHomepage.oneLiner || parsedHomepage.productSummary) {
          companyResearchData.homepage = {
            oneLiner: parsedHomepage.oneLiner,
            productSummary: parsedHomepage.productSummary,
            signals: parsedHomepage.signals,
          };

          // Filter, prioritize and visit up to 3 sub-pages
          const subpageCandidates = parsedHomepage.pageLinks || [];
          const prioritizedSubpages = subpageCandidates
            .map((link) => {
              let absoluteUrl = link.url;
              if (absoluteUrl.startsWith("/")) {
                absoluteUrl = `${homepageUrl}${absoluteUrl}`;
              }
              return { url: absoluteUrl, kind: link.kind };
            })
            .filter((link) => {
              try {
                const parsedLink = new URL(link.url);
                const parsedHome = new URL(homepageUrl);
                return parsedLink.hostname.endsWith(parsedHome.hostname);
              } catch {
                return false;
              }
            });

          const kindPriority = ["about", "blog", "engineering", "product", "team", "other"];
          prioritizedSubpages.sort((a, b) => {
            const indexA = kindPriority.indexOf(a.kind);
            const indexB = kindPriority.indexOf(b.kind);
            return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
          });

          const chosenSubpages = prioritizedSubpages.slice(0, 3);
          companyResearchData.subpages = [];

          for (const sub of chosenSubpages) {
            try {
              console.log(`[research-agent] Crawling subpage: ${sub.url} (${sub.kind})`);
              visitedUrls.push(sub.url);
              await page.goto(sub.url, { waitUntil: "domcontentloaded", timeout: 15000 });

              const subpageDetails = await stagehand.extract({
                instruction:
                  "Extract substance that helps a candidate understand this company before applying: what they do, their values and how they work, the specific technologies and tools they use, notable projects or customers, and how the team operates. Ignore nav, footers, cookie banners, and generic marketing copy.",
                schema: subPageSchema,
              });

              const parsedSubpage = subPageSchema.parse(subpageDetails);
              companyResearchData.subpages.push({
                url: sub.url,
                kind: sub.kind,
                keyPoints: parsedSubpage.keyPoints,
                technologies: parsedSubpage.technologies,
                valuesOrCulture: parsedSubpage.valuesOrCulture,
                notable: parsedSubpage.notable,
              });
            } catch (subCrawlError) {
              console.error(`[research-agent] Error crawling subpage ${sub.url}:`, subCrawlError);
            }
          }
        } else {
          console.warn("[research-agent] Homepage extraction returned no core data, skipping subpage crawling.");
        }
      } catch (crawlError: any) {
        console.error("[research-agent] Stagehand crawler failed:", crawlError);
        await logResearchEvent(user.id, `Web crawler encountered an error: ${crawlError.message || crawlError}`, "warning");
      } finally {
        if (stagehand) {
          try {
            await stagehand.close();
          } catch (closeErr) {
            console.error("[research-agent] Error closing stagehand session:", closeErr);
          }
        }
      }
    } else {
      console.warn("[research-agent] Browserbase or OpenAI keys missing. Skipping web research, running fallback synthesis.");
      await logResearchEvent(user.id, "Browserbase credentials missing; executing fallback data synthesis.", "info");
    }

    // 7. Groq Dossier Synthesis (llama-3.3-70b-versatile)
    const groqApiKey = process.env.GROK_API_KEY || process.env.GROQ_API_KEY;
    const openai = new OpenAI({
      apiKey: groqApiKey || "",
      baseURL: "https://api.groq.com/openai/v1",
    });

    const systemPrompt = `You are a sharp career strategist preparing a candidate to apply for a specific role. You are given (a) research collected from the company's own website, (b) the job posting, and (c) the candidate's profile. Produce a concise, concrete briefing that gives this specific candidate an edge for this specific role.

Rules:
- Ground every company claim in the provided research or job posting. Never invent funding, customers, headcount, or facts. If research was thin, infer carefully from the job posting and say what's inferred.
- Be specific to THIS candidate. Connect their actual skills and past work to this company's stack, product, and values. No generic advice that would apply to anyone.
- Turn the candidate's missing skills into a strategy: how to frame the gap honestly and what adjacent experience to lean on.
- Talking points and questions must reference real things from the research, the kind of detail that signals the candidate did their homework.
- Keep every item tight: one or two sentences. No fluff.

Return ONLY a valid JSON object matching this schema:
{
  "companyOverview": "string (what the company does and builds)",
  "techStack": ["string (technologies they use)"],
  "culture": ["string (values and working style)"],
  "whyThisRole": "string (why this role exists and its value to them)",
  "yourEdge": ["string (specific connections between candidate credentials and job)"],
  "gapsToAddress": ["string (how the candidate should address missing skills)"],
  "smartQuestions": ["string (highly researched questions for interviews)"],
  "interviewPrep": ["string (topics to prepare based on stack/role)"],
  "sources": ["string (list of URLs researched)"]
}`;

    const userPrompt = `COMPANY WEBSITE RESEARCH:
${JSON.stringify(companyResearchData)}

JOB POSTING DETAILS:
Title: ${job.title}
Company: ${job.company}
Description: ${job.about_role || ""}
Matched Skills: ${JSON.stringify(job.matched_skills || [])}
Missing Skills: ${JSON.stringify(job.missing_skills || [])}

CANDIDATE PROFILE:
Seeking Title: ${profile.current_title || ""}
Years of Experience: ${profile.years_experience || 0}
Skills: ${JSON.stringify(profile.skills || [])}
Work History: ${JSON.stringify(profile.work_experience || [])}`;

    let dossier: any = {};
    try {
      const completion = await openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const rawJson = completion.choices[0]?.message?.content || "{}";
      dossier = JSON.parse(rawJson);
    } catch (synthesisError: any) {
      console.error("[research-agent] LLM synthesis failed:", synthesisError);
      await logResearchEvent(user.id, `LLM synthesis failed: ${synthesisError.message || synthesisError}`, "error");
      return NextResponse.json({ error: "Dossier synthesis failed" }, { status: 500 });
    }

    const validatedDossier = dossierSchema.parse(dossier);

    // Merge in final list of crawled URLs if not already in sources
    const finalSources = Array.from(new Set([...(validatedDossier.sources || []), ...visitedUrls])).filter(Boolean);
    validatedDossier.sources = finalSources;

    // 8. Save dossier to Database
    const { error: updateError } = await insforge.database
      .from("jobs")
      .update({ company_research: validatedDossier })
      .eq("id", job.id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[research-agent] Failed to save dossier to DB:", updateError);
      await logResearchEvent(user.id, `Failed to update job record in database: ${updateError.message}`, "error");
      return NextResponse.json({ error: "Failed to persist dossier" }, { status: 500 });
    }

    await logResearchEvent(user.id, `Successfully completed company research dossier for ${job.company}`, "info");

    // 9. PostHog Tracking
    const posthog = getPostHogServer();
    posthog.capture({
      distinctId: user.id,
      event: "company_researched",
      properties: {
        userId: user.id,
        jobId: job.id,
        company: job.company,
      },
    });
    await shutdownPostHog();

    return NextResponse.json({ success: true, dossier: validatedDossier });
  } catch (error: any) {
    console.error("[research-agent] Unexpected error in research endpoint:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}
