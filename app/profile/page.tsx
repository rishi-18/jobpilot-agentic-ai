import Link from "next/link";

import { ProfileForm } from "@/components/profile/ProfileForm";
import { emptyProfile } from "@/lib/profile-empty";
import { createInsforgeServer } from "@/lib/insforge-server";
import { type Profile } from "@/lib/profile-mock";

import { NavbarAccountButton } from "../navbar-account-button";
import { UserSessionSync } from "../user-session-sync";

type ProfileRow = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  current_title: string | null;
  experience_level: string | null;
  years_experience: number | null;
  skills: string[] | null;
  industries: string[] | null;
  work_experience: Profile["workExperience"] | null;
  education: Profile["education"] | null;
  job_titles_seeking: string[] | null;
  remote_preference: string | null;
  preferred_locations: string[] | null;
  salary_expectation: string | null;
  cover_letter_tone: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  work_authorization: string | null;
  resume_pdf_url: string | null;
};

function profileFromRow(row: ProfileRow, email: string, signedUrl?: string): Profile {
  // Always layer the auth email on top so the disabled email field shows the
  // real, current identity even if the stored row is stale.
  return {
    ...emptyProfile(email),
    fullName: row.full_name ?? "",
    phone: row.phone ?? "",
    location: row.location ?? "",
    currentTitle: row.current_title ?? "",
    experienceLevel: row.experience_level ?? "",
    yearsExperience:
      row.years_experience === null || row.years_experience === undefined
        ? ""
        : String(row.years_experience),
    skills: row.skills ?? [],
    industries: row.industries ?? [],
    workExperience: row.work_experience ?? [],
    education: row.education ?? emptyProfile(email).education,
    jobTitlesSeeking: row.job_titles_seeking ?? [],
    remotePreference: row.remote_preference ?? "",
    preferredLocations: row.preferred_locations ?? [],
    salaryExpectation: row.salary_expectation ?? "",
    coverLetterTone: row.cover_letter_tone ?? "",
    linkedinUrl: row.linkedin_url ?? "",
    portfolioUrl: row.portfolio_url ?? "",
    workAuthorization: row.work_authorization ?? "",
    resume: row.resume_pdf_url
      ? {
          name: decodeURIComponent(row.resume_pdf_url.split("/").pop() || "resume.pdf"),
          size: 0,
          url: signedUrl,
        }
      : null,
  };
}

export default async function ProfilePage() {
  const insforge = await createInsforgeServer();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();

  const authEmail = user?.email ?? "";

  let initialProfile: Profile = emptyProfile(authEmail);
  if (user) {
    const { data: row, error } = await insforge.database
      .from("profiles")
      .select(
        "full_name,email,phone,location,current_title,experience_level,years_experience,skills,industries,work_experience,education,job_titles_seeking,remote_preference,preferred_locations,salary_expectation,cover_letter_tone,linkedin_url,portfolio_url,work_authorization,resume_pdf_url",
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[profile/page] failed to load profile row", error);
    } else if (row) {
      let signedUrl: string | undefined;
      const dbRow = row as ProfileRow;
      if (dbRow.resume_pdf_url) {
        try {
          let objectPath = `${user.id}/resume.pdf`;
          try {
            const urlObj = new URL(dbRow.resume_pdf_url);
            const parts = urlObj.pathname.split("/objects/");
            if (parts.length > 1) {
              objectPath = decodeURIComponent(parts[1]);
            } else {
              const cdnParts = urlObj.pathname.split("/resumes/");
              if (cdnParts.length > 1) {
                objectPath = decodeURIComponent(cdnParts[1]);
              }
            }
          } catch (err) {
            console.warn("[profile/page] failed to parse resume_pdf_url:", err);
          }

          const { data: signedData, error: signedError } = await insforge.storage
            .from("resumes")
            .createSignedUrl(objectPath, 3600);
          if (signedError) {
            console.error("[profile/page] failed to create signed URL", signedError);
          } else if (signedData) {
            signedUrl = signedData.signedUrl;
          }
        } catch (signedErr) {
          console.error("[profile/page] failed to generate signed URL", signedErr);
        }
      }
      initialProfile = profileFromRow(dbRow, authEmail, signedUrl);
    }
  }

  const accountLabel = (user?.profile?.name?.trim() || user?.email) ?? "Account";
  const sessionUser = user
    ? { id: user.id, email: user.email ?? null, name: user.profile?.name ?? null }
    : null;

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
            <Link href="/dashboard" className="transition-colors hover:text-accent">Dashboard</Link>
            <Link href="/find-jobs" className="transition-colors hover:text-accent">Find Jobs</Link>
            <Link href="/profile" className="text-accent">Profile</Link>
          </nav>

          <NavbarAccountButton label={accountLabel} />
        </header>

        <section className="border-x border-border bg-surface px-8 py-8">
          <ProfileForm initialProfile={initialProfile} />
        </section>
      </div>
    </main>
  );
}