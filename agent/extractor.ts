import pdf from "pdf-parse";
import OpenAI from "openai";
import { z } from "zod";

import { logAgentError } from "@/lib/agent-logger";

const workExperienceSchema = z.object({
  company: z.string().catch(""),
  title: z.string().catch(""),
  startDate: z.string().catch(""),
  endDate: z.string().catch(""),
  currentlyWorking: z.boolean().catch(false),
  responsibilities: z.string().catch(""),
});

const educationSchema = z.object({
  degree: z.enum(["", "associate", "bachelors", "masters", "doctorate"]).catch(""),
  fieldOfStudy: z.string().catch(""),
  institution: z.string().catch(""),
  graduationYear: z.string().catch(""),
});

const extractedProfileSchema = z.object({
  fullName: z.string().catch(""),
  phone: z.string().catch(""),
  location: z.string().catch(""),
  linkedinUrl: z.string().catch(""),
  portfolioUrl: z.string().catch(""),
  workAuthorization: z.enum(["", "citizen", "permanent_resident", "visa_required"]).catch(""),
  currentTitle: z.string().catch(""),
  experienceLevel: z.enum(["", "junior", "mid", "senior", "lead"]).catch(""),
  yearsExperience: z.string().catch(""),
  skills: z.array(z.string()).catch([]),
  industries: z.array(z.string()).catch([]),
  workExperience: z.array(workExperienceSchema).catch([]),
  education: educationSchema.catch({
    degree: "" as const,
    fieldOfStudy: "",
    institution: "",
    graduationYear: "",
  }),
  jobTitlesSeeking: z.array(z.string()).catch([]),
  remotePreference: z.enum(["", "remote", "hybrid", "onsite", "any"]).catch(""),
  preferredLocations: z.array(z.string()).catch([]),
  salaryExpectation: z.string().catch(""),
  coverLetterTone: z.enum(["", "formal", "casual", "enthusiastic"]).catch(""),
});

export type ExtractedProfile = z.infer<typeof extractedProfileSchema>;

export async function extractProfileFromPdf(
  pdfBuffer: Buffer,
  userId: string
): Promise<{ success: boolean; data?: ExtractedProfile; error?: string }> {
  try {
    // 1. Extract text using pdf-parse's default parser function.
    let text = "";
    try {
      const pdfData = await pdf(pdfBuffer);
      text = pdfData.text?.trim() || "";
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[agent/extractor] pdf-parse error:", errMsg);
      await logAgentError(userId, `pdf-parse failed to parse buffer: ${errMsg}`, "error");
      return {
        success: false,
        error: "Could not parse PDF. Please verify that the PDF is not corrupted or scanned.",
      };
    }

    if (text.length < 50) {
      await logAgentError(userId, "pdf-parse returned text under 50 characters", "warning");
      return {
        success: false,
        error: "Could not extract text from this PDF. Please try a different file.",
      };
    }

    // 2. Call OpenAI GPT-4o
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are a precise resume parser. Your job is to extract candidate profile data from the raw text of a resume PDF and format it into a structured JSON object.

Extract data for the following fields:
- fullName: Candidate's full name
- phone: Phone number
- location: City, State/Country
- linkedinUrl: LinkedIn profile URL (if present)
- portfolioUrl: Personal website or GitHub URL (if present)
- workAuthorization: Extract if mentioned. Map to one of: "citizen", "permanent_resident", "visa_required", or "" (empty string) if unknown.
- currentTitle: Most recent job title
- experienceLevel: Map based on years and title to one of: "junior", "mid", "senior", "lead", or "" (empty string) if unknown.
- yearsExperience: Total years of professional experience as a string containing only a number (e.g. "5"). If unknown or 0, return "".
- skills: Array of up to 15 key technical skills found.
- industries: Array of industries the candidate has worked in (e.g. "Fintech", "SaaS", "Healthcare").
- workExperience: Array of up to 3 most recent roles. Each role MUST have:
  - company: Company name
  - title: Job title
  - startDate: Start date in YYYY-MM format. If only year is given, use YYYY-01.
  - endDate: End date in YYYY-MM format. If currently working here, use "".
  - currentlyWorking: Boolean indicating if this is their current role.
  - responsibilities: Bullet points or a brief summary of key duties.
- education: Object containing the highest degree info:
  - degree: Map to one of: "associate", "bachelors", "masters", "doctorate", or "" (empty string) if unknown/other.
  - fieldOfStudy: Field of study (e.g. "Computer Science")
  - institution: School or University name
  - graduationYear: YYYY graduation year (e.g. "2020")
- jobTitlesSeeking: Array of job titles the candidate is seeking (infer from current title and resume focus).
- remotePreference: Map if mentioned, otherwise "". Option values: "remote", "hybrid", "onsite", "any", or "".
- preferredLocations: Array of preferred locations (if mentioned).
- salaryExpectation: Salary expectation (if mentioned).
- coverLetterTone: Map based on resume style to one of: "formal", "casual", "enthusiastic", or "" (empty string). Default to "formal".

Only return JSON matching this schema. If any field cannot be found, default it to empty string or empty array as appropriate. Return ONLY the raw JSON text.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (!content) {
      await logAgentError(userId, "OpenAI GPT-4o returned empty completion content for resume extraction", "error");
      return {
        success: false,
        error: "AI model failed to return a response.",
      };
    }

    let rawJson;
    try {
      rawJson = JSON.parse(content);
    } catch (parseErr) {
      const parseErrMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      await logAgentError(userId, `Failed to parse GPT-4o JSON response: ${parseErrMsg}`, "error");
      return {
        success: false,
        error: "Failed to parse extracted data.",
      };
    }

    const parsed = extractedProfileSchema.safeParse(rawJson);
    if (!parsed.success) {
      console.error("[agent/extractor] zod validation error:", parsed.error);
      await logAgentError(userId, `Zod validation failed for extracted profile structure: ${parsed.error.message}`, "error");
      return {
        success: false,
        error: "Failed to validate the extracted profile data structure.",
      };
    }

    // Ensure workExperience is at most 3 elements
    const data = parsed.data;
    if (data.workExperience.length > 3) {
      data.workExperience = data.workExperience.slice(0, 3);
    }

    await logAgentError(userId, `Successfully parsed and structured resume for ${data.fullName || "unknown"}`, "success");

    return {
      success: true,
      data,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[agent/extractor] unexpected extraction error:", errorMsg);
    await logAgentError(userId, `Unexpected error during resume extraction: ${errorMsg}`, "error");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}
