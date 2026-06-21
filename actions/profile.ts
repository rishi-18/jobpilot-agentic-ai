"use server";

import { revalidatePath } from "next/cache";

import { createInsforgeServer } from "@/lib/insforge-server";
import { computeCompletion } from "@/lib/profile-completeness";
import { getPostHogServer, shutdownPostHog } from "@/lib/posthog-server";
import { type WorkExperience } from "@/lib/profile-mock";

const MAX_ROLES = 3;
const MAX_RESUME_BYTES = 10 * 1024 * 1024;
const RESUME_BUCKET = "resumes";
const RESUME_OBJECT_PATH = (userId: string) => `${userId}/resume.pdf`;

export type WorkExperienceInput = WorkExperience;
export type EducationInput = WorkExperience["title"] extends never
  ? never
  : {
      degree: string;
      fieldOfStudy: string;
      institution: string;
      graduationYear: string;
    };

export type EducationPayload = {
  degree: string;
  fieldOfStudy: string;
  institution: string;
  graduationYear: string;
};

export type SaveProfilePayload = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
  workAuthorization: string;
  currentTitle: string;
  experienceLevel: string;
  yearsExperience: string;
  skills: string[];
  industries: string[];
  workExperience: WorkExperienceInput[];
  education: EducationPayload;
  jobTitlesSeeking: string[];
  remotePreference: string;
  preferredLocations: string[];
  salaryExpectation: string;
  coverLetterTone: string;
  // `null` means the user cleared the resume and wants the storage object
  // removed. `undefined` means the user did not touch the resume and the
  // existing URL should be left alone.
  resumeAction?: "keep" | "clear" | null;
};

export type SaveProfileResult =
  | { ok: true; isComplete: boolean }
  | { ok: false; message: string };

function cleanString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeYears(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed;
}

function normalizeRoles(roles: WorkExperience[]): WorkExperience[] {
  return roles.slice(0, MAX_ROLES).map((role) => ({
    company: cleanString(role.company) ?? "",
    title: cleanString(role.title) ?? "",
    startDate: cleanString(role.startDate) ?? "",
    endDate: role.currentlyWorking ? "" : cleanString(role.endDate) ?? "",
    currentlyWorking: Boolean(role.currentlyWorking),
    responsibilities: role.responsibilities ?? "",
  }));
}

function normalizeTags(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter((v) => v.length > 0)));
}

export async function saveProfile(
  payload: SaveProfilePayload,
  resumeFile?: File | null,
  resumeAction?: SaveProfilePayload["resumeAction"],
): Promise<SaveProfileResult> {
  try {
    const insforge = await createInsforgeServer();
    const {
      data: { user },
    } = await insforge.auth.getCurrentUser();
    if (!user) {
      return { ok: false, message: "You need to be signed in to save your profile." };
    }

    const yearsExperience = normalizeYears(payload.yearsExperience);
    if (payload.yearsExperience.trim().length > 0 && yearsExperience === null) {
      return { ok: false, message: "Years of experience must be a non-negative number." };
    }

    // Read the prior row so we can detect the false -> true flip on is_complete
    // and so we know whether to delete a stale resume object when clearing.
    const { data: priorRow } = await insforge.database
      .from("profiles")
      .select("is_complete,resume_pdf_url")
      .eq("id", user.id)
      .maybeSingle();
    const priorIsComplete = Boolean((priorRow as { is_complete?: boolean } | null)?.is_complete);
    const priorResumeUrl = (priorRow as { resume_pdf_url?: string | null } | null)?.resume_pdf_url ?? null;

    let resumePdfUrl: string | null | undefined; // undefined = do not touch the column
    if (resumeFile) {
      if (resumeFile.size > MAX_RESUME_BYTES) {
        return { ok: false, message: "Resume must be under 10 MB." };
      }
      const objectPath = RESUME_OBJECT_PATH(user.id);
      const { error: uploadError } = await insforge.storage
        .from(RESUME_BUCKET)
        .upload(objectPath, resumeFile);
      if (uploadError) {
        console.error("[profile/save] resume upload failed", uploadError);
        return { ok: false, message: "We could not upload your resume. Please try again." };
      }
      const { data: urlData } = insforge.storage.from(RESUME_BUCKET).getPublicUrl(objectPath);
      resumePdfUrl = urlData?.publicUrl ?? null;
    } else if (resumeAction === "clear") {
      // Best-effort removal — a missing object should not block the form save.
      const { error: removeError } = await insforge.storage
        .from(RESUME_BUCKET)
        .remove(RESUME_OBJECT_PATH(user.id));
      if (removeError) {
        console.warn("[profile/save] resume remove failed", removeError);
      }
      resumePdfUrl = null;
    } else {
      // Keep — leave resume_pdf_url as it is on the DB side.
      resumePdfUrl = priorResumeUrl;
    }

    const skills = normalizeTags(payload.skills);
    const industries = normalizeTags(payload.industries);
    const jobTitlesSeeking = normalizeTags(payload.jobTitlesSeeking);
    const preferredLocations = normalizeTags(payload.preferredLocations);

    const education: EducationPayload = {
      degree: cleanString(payload.education.degree) ?? "",
      fieldOfStudy: cleanString(payload.education.fieldOfStudy) ?? "",
      institution: cleanString(payload.education.institution) ?? "",
      graduationYear: payload.education.graduationYear.trim().slice(0, 4),
    };

    const workExperience = normalizeRoles(payload.workExperience);

    const completion = computeCompletion({
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      location: payload.location,
      linkedinUrl: payload.linkedinUrl,
      portfolioUrl: payload.portfolioUrl,
      workAuthorization: payload.workAuthorization,
      currentTitle: payload.currentTitle,
      experienceLevel: payload.experienceLevel,
      yearsExperience: yearsExperience === null ? "" : String(yearsExperience),
      skills,
      industries,
      workExperience,
      education,
      jobTitlesSeeking,
      remotePreference: payload.remotePreference,
      preferredLocations,
      salaryExpectation: payload.salaryExpectation,
      coverLetterTone: payload.coverLetterTone,
      resume: payload.resumeAction === null ? null : null,
    });

    const upsertPayload: Record<string, unknown> = {
      id: user.id,
      email: user.email ?? null,
      full_name: cleanString(payload.fullName),
      phone: cleanString(payload.phone),
      location: cleanString(payload.location),
      current_title: cleanString(payload.currentTitle),
      experience_level: cleanString(payload.experienceLevel),
      years_experience: yearsExperience,
      skills,
      industries,
      work_experience: workExperience,
      education,
      job_titles_seeking: jobTitlesSeeking,
      remote_preference: cleanString(payload.remotePreference),
      preferred_locations: preferredLocations,
      salary_expectation: cleanString(payload.salaryExpectation),
      cover_letter_tone: cleanString(payload.coverLetterTone),
      linkedin_url: cleanString(payload.linkedinUrl),
      portfolio_url: cleanString(payload.portfolioUrl),
      work_authorization: cleanString(payload.workAuthorization),
      is_complete: completion.isComplete,
      updated_at: new Date().toISOString(),
    };
    if (resumePdfUrl !== undefined) {
      upsertPayload.resume_pdf_url = resumePdfUrl;
    }

    const { error: upsertError } = await insforge.database
      .from("profiles")
      .upsert(upsertPayload, { onConflict: "id" });

    if (upsertError) {
      console.error("[profile/save] upsert failed", upsertError);
      return { ok: false, message: "We could not save your profile. Please try again." };
    }

    // Fire profile_completed exactly once — only on the false -> true flip. We
    // do this server-side so the PostHog identify from the browser is the
    // matching identity, and the short-lived Node runtime can shutdown cleanly.
    if (completion.isComplete && !priorIsComplete) {
      try {
        const posthog = getPostHogServer();
        posthog.capture({
          distinctId: user.id,
          event: "profile_completed",
          properties: { userId: user.id },
        });
      } catch (posthogError) {
        console.warn("[profile/save] profile_completed capture failed", posthogError);
      } finally {
        await shutdownPostHog();
      }
    }

    revalidatePath("/profile");

    return { ok: true, isComplete: completion.isComplete };
  } catch (error) {
    console.error("[profile/save] unexpected error", error);
    return { ok: false, message: "Something went wrong saving your profile. Please try again." };
  }
}