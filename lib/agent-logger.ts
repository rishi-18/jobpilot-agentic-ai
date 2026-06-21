import { createInsforgeServer } from "./insforge-server";

export async function logAgentError(
  userId: string,
  message: string,
  level: "info" | "success" | "warning" | "error" = "error",
  runId?: string | null,
  jobId?: string | null
) {
  try {
    const insforge = await createInsforgeServer();
    const { error } = await insforge.database.from("agent_logs").insert({
      user_id: userId,
      run_id: runId || null,
      message,
      level,
      job_id: jobId || null,
    });
    if (error) {
      console.error("[agent-logger] Database insert error:", error);
    }
  } catch (err) {
    console.error("[agent-logger] Failed to write log to DB:", err);
  }
}
