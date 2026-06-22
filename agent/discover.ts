import { createInsforgeServer } from "@/lib/insforge-server";
import { searchJobs, detectCountry } from "@/lib/adzuna";
import { getPostHogServer } from "@/lib/posthog-server";
import { logAgentError } from "@/lib/agent-logger";
import OpenAI from "openai";
import { z } from "zod";

const matchResponseSchema = z.object({
  matchScore: z.number().int().min(0).max(100).catch(0),
  matchReason: z.string().catch("Failed to generate match reason."),
  matchedSkills: z.array(z.string()).catch([]),
  missingSkills: z.array(z.string()).catch([]),
});

export async function discoverAndScoreJobs(
  userId: string,
  runId: string,
  jobTitle: string,
  location: string
): Promise<{ success: boolean; jobsCount: number; error?: string }> {
  try {
    const insforge = await createInsforgeServer();

    // 1. Fetch current profile from database
    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      const errMsg = profileError?.message || "User profile not found.";
      await logAgentError(userId, `Profile load failed: ${errMsg}`, "error", runId);
      return { success: false, jobsCount: 0, error: errMsg };
    }

    // 2. Fetch jobs from Adzuna API
    const country = detectCountry(location);
    const adzunaJobs = await searchJobs(jobTitle, location, country);

    if (adzunaJobs.length === 0) {
      await insforge.database
        .from("agent_logs")
        .insert({
          user_id: userId,
          run_id: runId,
          message: `Adzuna API returned 0 results for title "${jobTitle}" and location "${location}".`,
          level: "warning",
        });
      return { success: true, jobsCount: 0 };
    }

    await insforge.database
      .from("agent_logs")
      .insert({
        user_id: userId,
        run_id: runId,
        message: `Discovered ${adzunaJobs.length} job postings from Adzuna. Starting scoring...`,
        level: "info",
      });

    // 3. Initialize OpenAI client for Groq LLM (llama-3.3-70b-versatile)
    const groqApiKey = process.env.GROK_API_KEY || process.env.GROQ_API_KEY;
    const openai = new OpenAI({
      apiKey: groqApiKey || "",
      baseURL: "https://api.groq.com/openai/v1",
    });

    const systemPrompt = `You are a precise job matching assistant. Your job is to compare a job posting against a candidate's profile and determine the match score and detailed compatibility metrics.

Return ONLY a valid JSON object matching this schema:
{
  "matchScore": number (integer from 0 to 100),
  "matchReason": "A concise one-paragraph explanation of why the candidate fits or does not fit this role",
  "matchedSkills": ["Skill A", "Skill B" - skills candidate has that the job requires],
  "missingSkills": ["Skill X", "Skill Y" - key technical skills the job requires that the candidate lacks]
}

Rules:
- Be honest and objective.
- matchedSkills must only contain skills listed in the candidate's skills array.
- missingSkills must only contain skills mentioned/implied in the job description that are NOT in the candidate's skills array.
- Keep the reason professional and concise.`;

    const posthog = getPostHogServer();

    // 4. Score and insert each job (run in parallel using Promise.all)
    const scorePromises = adzunaJobs.map(async (job) => {
      const userPrompt = `CANDIDATE PROFILE:
Title: ${profile.current_title || ""}
Experience Level: ${profile.experience_level || ""}
Years of Experience: ${profile.years_experience ?? 0}
Skills: ${JSON.stringify(profile.skills || [])}
Work History: ${JSON.stringify(profile.work_experience || [])}

JOB POSTING:
Title: ${job.title || ""}
Company: ${job.company?.display_name || ""}
Location: ${job.location?.display_name || ""}
Description: ${job.description || ""}`;

      let scoreResult = {
        matchScore: 0,
        matchReason: "Failed to analyze match compatibility.",
        matchedSkills: [] as string[],
        missingSkills: [] as string[],
      };

      try {
        const completion = await openai.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          temperature: 0.3,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const rawJson = completion.choices[0]?.message?.content || "{}";
        const parsed = matchResponseSchema.parse(JSON.parse(rawJson));
        scoreResult = {
          matchScore: parsed.matchScore,
          matchReason: parsed.matchReason,
          matchedSkills: parsed.matchedSkills,
          missingSkills: parsed.missingSkills,
        };
      } catch (aiError: any) {
        console.error(`[adzuna/score] AI scoring failed for job "${job.title}":`, aiError);
        await logAgentError(
          userId,
          `Scoring failed for job "${job.title}" at "${job.company?.display_name}": ${aiError.message || aiError}`,
          "warning",
          runId
        );
      }

      // Map job contract type safely to database check constraints
      let jobType: "fulltime" | "parttime" | "contract" | null = null;
      if (job.contract_type === "permanent") {
        jobType = "fulltime";
      } else if (job.contract_type === "contract") {
        jobType = "contract";
      } else if (job.contract_type === "parttime" || job.contract_type === "part_time") {
        jobType = "parttime";
      }

      // Create salary string safely
      const salaryStr = job.salary_min
        ? `$${Math.round(job.salary_min / 1000)}k` + (job.salary_max ? ` - $${Math.round(job.salary_max / 1000)}k` : "")
        : null;

      // Insert job record into jobs table
      const { data: insertedJob, error: insertError } = await insforge.database
        .from("jobs")
        .insert({
          user_id: userId,
          run_id: runId,
          source: "search",
          source_url: job.redirect_url,
          external_apply_url: job.redirect_url,
          title: job.title || "Untitled Role",
          company: job.company?.display_name || "Unknown Company",
          location: job.location?.display_name || null,
          salary: salaryStr,
          job_type: jobType,
          about_role: job.description || null,
          match_score: scoreResult.matchScore,
          match_reason: scoreResult.matchReason,
          matched_skills: scoreResult.matchedSkills,
          missing_skills: scoreResult.missingSkills,
        })
        .select()
        .maybeSingle();

      if (insertError) {
        console.error(`[adzuna/insert] failed to save job "${job.title}":`, insertError);
        await logAgentError(
          userId,
          `Failed to save job "${job.title}" to database: ${insertError.message}`,
          "error",
          runId
        );
      } else if (insertedJob) {
        // Track the job_found event in PostHog
        posthog.capture({
          distinctId: userId,
          event: "job_found",
          properties: {
            userId,
            source: "search",
            matchScore: scoreResult.matchScore,
          },
        });
      }
    });

    await Promise.all(scorePromises);

    return { success: true, jobsCount: adzunaJobs.length };
  } catch (error: any) {
    console.error("[adzuna/discover] unexpected error:", error);
    await logAgentError(userId, `Unexpected discover error: ${error.message || error}`, "error", runId);
    return { success: false, jobsCount: 0, error: error.message || String(error) };
  }
}
