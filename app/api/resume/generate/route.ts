import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import OpenAI from "openai";
import { z } from "zod";

import { createInsforgeServer } from "@/lib/insforge-server";
import { ResumePdfDocument } from "@/lib/resume-pdf-template";
import type { Profile } from "@/lib/profile-mock";

const RESUME_BUCKET = "resumes";
const RESUME_OBJECT_PATH = (userId: string) => `${userId}/resume.pdf`;

const llmResponseSchema = z.object({
  summary: z.string().catch(""),
  workExperience: z
    .array(
      z.object({
        company: z.string().catch(""),
        title: z.string().catch(""),
        bullets: z.array(z.string()).catch([]),
      }),
    )
    .catch([]),
});

export async function POST(req: NextRequest) {
  try {
    const insforge = await createInsforgeServer();
    const {
      data: { user },
    } = await insforge.auth.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "You must be logged in to generate a resume." },
        { status: 401 },
      );
    }

    // 1. Fetch current profile data from profiles table
    const { data: profileRow, error: dbError } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (dbError || !profileRow) {
      return NextResponse.json(
        {
          success: false,
          error: dbError?.message || "Profile not found. Please save your profile first.",
        },
        { status: 400 },
      );
    }

    // Map database shape to Profile type
    const rawExperience = profileRow.work_experience || [];
    const profile: Profile = {
      fullName: profileRow.full_name || "",
      email: profileRow.email || user.email || "",
      phone: profileRow.phone || "",
      location: profileRow.location || "",
      linkedinUrl: profileRow.linkedin_url || "",
      portfolioUrl: profileRow.portfolio_url || "",
      workAuthorization: profileRow.work_authorization || "",
      currentTitle: profileRow.current_title || "",
      experienceLevel: profileRow.experience_level || "",
      yearsExperience:
        profileRow.years_experience === null || profileRow.years_experience === undefined
          ? ""
          : String(profileRow.years_experience),
      skills: profileRow.skills || [],
      industries: profileRow.industries || [],
      workExperience: rawExperience.map((exp: any) => ({
        company: exp.company || "",
        title: exp.title || exp.jobTitle || "",
        startDate: exp.startDate || "",
        endDate: exp.endDate || "",
        currentlyWorking: Boolean(exp.currentlyWorking),
        responsibilities: exp.responsibilities || exp.description || "",
      })),
      education: {
        degree: profileRow.education?.degree || "",
        fieldOfStudy: profileRow.education?.fieldOfStudy || "",
        institution: profileRow.education?.institution || "",
        graduationYear: profileRow.education?.graduationYear || "",
      },
      jobTitlesSeeking: profileRow.job_titles_seeking || [],
      remotePreference: profileRow.remote_preference || "",
      preferredLocations: profileRow.preferred_locations || [],
      salaryExpectation: profileRow.salary_expectation || "",
      coverLetterTone: profileRow.cover_letter_tone || "",
      resume: null,
    };

    // 2. Call Groq Llama model to polish the summary and work experience bullets
    const groqApiKey = process.env.GROK_API_KEY || process.env.GROQ_API_KEY;
    const openai = new OpenAI({
      apiKey: groqApiKey || "",
      baseURL: "https://api.groq.com/openai/v1",
    });

    const systemPrompt = `You are a professional resume writer. Your job is to rewrite the user's career details into a highly polished, professional summary and action-oriented work experience bullet points.
Return ONLY valid JSON matching this schema:
{
  "summary": "Compelling 3-4 sentence professional summary tailored to their target titles and skills",
  "workExperience": [
    {
      "company": "Exact Company Name",
      "title": "Exact Job Title",
      "bullets": [
        "Action-oriented bullet point starting with a strong past-tense action verb (or present-tense for current jobs)",
        "Impact-driven bullet point showing responsibilities, tools used, and potential outcome",
        "Clear professional achievement bullet point"
      ]
    }
  ]
}
Rules:
- Retain exact company names and job titles.
- Focus on strong action verbs and clean professional language.
- Keep bullets concise (1-2 sentences each). Provide 2-3 bullets per experience.`;

    const userMessage = {
      fullName: profile.fullName,
      currentTitle: profile.currentTitle,
      skills: profile.skills,
      industries: profile.industries,
      jobTitlesSeeking: profile.jobTitlesSeeking,
      workExperience: profile.workExperience.map((exp) => ({
        company: exp.company,
        title: exp.title,
        responsibilities: exp.responsibilities,
      })),
    };

    let polishedSummary = "";
    let polishedExperiences: any[] = [];

    try {
      const completion = await openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userMessage) },
        ],
      });

      const rawJson = completion.choices[0]?.message?.content || "{}";
      const parsedData = llmResponseSchema.parse(JSON.parse(rawJson));

      polishedSummary = parsedData.summary;
      polishedExperiences = parsedData.workExperience;
    } catch (aiError) {
      console.error("[api/resume/generate] AI generation error:", aiError);
      // Fallback is handled implicitly below by letting the PDF template use raw details.
    }

    // 3. Render PDF document to buffer using @react-pdf/renderer
    const pdfElement = React.createElement(ResumePdfDocument, {
      profile,
      polishedSummary,
      polishedExperiences,
    });
    const pdfBuffer = await renderToBuffer(pdfElement as any);

    // 4. Clean up any existing resume files under user's directory and upload new PDF
    const userFolderPrefix = `${user.id}/`;
    try {
      const listRes = await insforge.storage.from(RESUME_BUCKET).list({ prefix: userFolderPrefix });
      if (listRes.data && Array.isArray(listRes.data)) {
        for (const file of listRes.data) {
          const fileKey = file.key || file.name || (typeof file === "string" ? file : "");
          if (fileKey) {
            console.log("[api/resume/generate] cleaning up file:", fileKey);
            await insforge.storage.from(RESUME_BUCKET).remove(fileKey);
          }
        }
      }
    } catch (err) {
      console.warn("[api/resume/generate] cleanup failed:", err);
    }

    const objectPath = RESUME_OBJECT_PATH(user.id);
    const pdfFile = new File([new Uint8Array(pdfBuffer)], "resume.pdf", { type: "application/pdf" });

    const uploadRes = await insforge.storage.from(RESUME_BUCKET).upload(objectPath, pdfFile);
    console.log("[api/resume/generate] upload result details:", JSON.stringify(uploadRes));

    if (uploadRes.error || !uploadRes.data?.key) {
      console.error("[api/resume/generate] upload failed:", uploadRes.error);
      return NextResponse.json(
        { success: false, error: "Failed to upload the generated resume to storage." },
        { status: 500 },
      );
    }

    const finalKey = uploadRes.data.key;

    // Get public URL
    const { data: urlData } = insforge.storage.from(RESUME_BUCKET).getPublicUrl(finalKey);
    const resumePdfUrl = urlData?.publicUrl || null;

    if (!resumePdfUrl) {
      return NextResponse.json(
        { success: false, error: "Failed to resolve the generated resume URL." },
        { status: 500 },
      );
    }

    // 5. Update profiles table with resume_pdf_url
    const { error: updateError } = await insforge.database
      .from("profiles")
      .update({
        resume_pdf_url: resumePdfUrl,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[api/resume/generate] DB update failed:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update profile with the generated resume URL." },
        { status: 500 },
      );
    }

    // 6. Generate secure signed URL for instant viewing
    const { data: signedData, error: signedError } = await insforge.storage
      .from(RESUME_BUCKET)
      .createSignedUrl(finalKey, 3600);

    if (signedError || !signedData) {
      console.error("[api/resume/generate] signed URL creation failed:", signedError);
      return NextResponse.json(
        { success: false, error: "Failed to create signed URL for the generated resume." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        name: "resume.pdf",
        url: signedData.signedUrl,
      },
    });
  } catch (error) {
    console.error("[api/resume/generate] unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during resume generation." },
      { status: 500 },
    );
  }
}
