import { NextRequest, NextResponse } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";
import { discoverAndScoreJobs } from "@/agent/discover";
import { getPostHogServer, shutdownPostHog } from "@/lib/posthog-server";
import { logAgentError } from "@/lib/agent-logger";

export async function POST(req: NextRequest) {
  let runId: string | undefined;
  let userId: string | undefined;

  try {
    const insforge = await createInsforgeServer();
    const {
      data: { user },
    } = await insforge.auth.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    userId = user.id;

    // Validate request body
    const body = await req.json();
    const { jobTitle, location } = body;

    if (!jobTitle || typeof jobTitle !== "string") {
      return NextResponse.json(
        { success: false, error: "Job title is required and must be a string." },
        { status: 400 }
      );
    }

    // 1. Create a new agent run record in the database
    const { data: run, error: runError } = await insforge.database
      .from("agent_runs")
      .insert({
        user_id: user.id,
        status: "running",
        job_title_searched: jobTitle,
        location_searched: location || "",
        jobs_found: 0,
      })
      .select()
      .maybeSingle();

    if (runError || !run) {
      console.error("[agent/find] failed to create agent run:", runError);
      return NextResponse.json(
        { success: false, error: "Failed to initialize search session." },
        { status: 500 }
      );
    }

    runId = run.id;

    // 2. Track the search start in PostHog
    const posthog = getPostHogServer();
    posthog.capture({
      distinctId: user.id,
      event: "job_search_started",
      properties: {
        userId: user.id,
        jobTitle,
        location: location || "",
      },
    });

    // 3. Call the agent to fetch and score jobs
    const agentResult = await discoverAndScoreJobs(user.id, run.id, jobTitle, location || "");

    // 4. Update the agent run with results
    const { error: updateError } = await insforge.database
      .from("agent_runs")
      .update({
        status: agentResult.success ? "completed" : "failed",
        jobs_found: agentResult.jobsCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    if (updateError) {
      console.error("[agent/find] failed to update agent run:", updateError);
    }

    if (!agentResult.success) {
      return NextResponse.json(
        { success: false, error: agentResult.error || "Search execution failed." },
        { status: 500 }
      );
    }

    // Load jobs that matched >= 70 score (or total matches count) to present in the summary
    const matchesCount = agentResult.jobsCount;

    return NextResponse.json({
      success: true,
      data: {
        runId: run.id,
        jobsFound: agentResult.jobsCount,
        message: `Found ${agentResult.jobsCount} jobs matching your search criteria.`,
      },
    });
  } catch (error: any) {
    console.error("[agent/find] unexpected error:", error);
    if (userId && runId) {
      await logAgentError(userId, `Search route error: ${error.message || error}`, "error", runId);
      // Try best-effort fail of the agent run
      try {
        const insforge = await createInsforgeServer();
        await insforge.database
          .from("agent_runs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", runId);
      } catch (dbErr) {
        console.error("[agent/find] failed to fail run in catch block:", dbErr);
      }
    }
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 }
    );
  } finally {
    // Flush and shutdown PostHog
    await shutdownPostHog();
  }
}
