"use client";

import { useMemo, useRef, useState, useTransition } from "react";

import { saveProfile, type SaveProfilePayload } from "@/actions/profile";
import { computeCompletion } from "@/lib/profile-completeness";
import { type Profile } from "@/lib/profile-mock";

import { AttentionBanner } from "./AttentionBanner";
import { ResumeSection, type ResumeSectionHandle } from "./ResumeSection";
import { TagInput } from "./TagInput";
import { WorkExperienceList } from "./WorkExperienceList";

type Props = {
  initialProfile: Profile;
};

const WORK_AUTHORIZATION_OPTIONS = [
  { value: "", label: "Work Authorization" },
  { value: "citizen", label: "Citizen" },
  { value: "permanent_resident", label: "Permanent Resident" },
  { value: "visa_required", label: "Visa Required" },
];

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: "", label: "Experience Level" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
];

const DEGREE_OPTIONS = [
  { value: "", label: "Highest Degree" },
  { value: "associate", label: "Associate" },
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "doctorate", label: "Doctorate" },
];

const REMOTE_OPTIONS = [
  { value: "", label: "Remote Preference" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
  { value: "any", label: "Any" },
];

const TONE_OPTIONS = [
  { value: "", label: "Cover Letter Tone" },
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "enthusiastic", label: "Enthusiastic" },
];

const inputClass =
  "w-full rounded-md border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

type Status =
  | { kind: "idle" }
  | { kind: "saved"; at: string; isComplete: boolean }
  | { kind: "extracted"; at: string }
  | { kind: "error"; message: string };

export function ProfileForm({ initialProfile }: Props) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isSaving, startTransition] = useTransition();
  const [isExtracting, setIsExtracting] = useState(false);
  const resumeRef = useRef<ResumeSectionHandle>(null);
  // Track whether the user explicitly removed the resume on this save so the
  // server action knows to drop the storage object, even if `profile.resume`
  // was null before they ever uploaded anything.
  const resumeClearedRef = useRef(false);

  async function handleExtract() {
    const pendingFile = resumeRef.current?.getPendingFile() ?? null;
    const formData = new FormData();
    if (pendingFile) {
      formData.append("resume", pendingFile);
    }

    setIsExtracting(true);
    setStatus({ kind: "idle" });

    try {
      const response = await fetch("/api/resume/extract", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.data) {
        setProfile((prev) => ({
          ...prev,
          fullName: result.data.fullName || prev.fullName,
          phone: result.data.phone || prev.phone,
          location: result.data.location || prev.location,
          linkedinUrl: result.data.linkedinUrl || prev.linkedinUrl,
          portfolioUrl: result.data.portfolioUrl || prev.portfolioUrl,
          workAuthorization: result.data.workAuthorization || prev.workAuthorization,
          currentTitle: result.data.currentTitle || prev.currentTitle,
          experienceLevel: result.data.experienceLevel || prev.experienceLevel,
          yearsExperience: result.data.yearsExperience || prev.yearsExperience,
          skills: result.data.skills?.length ? result.data.skills : prev.skills,
          industries: result.data.industries?.length ? result.data.industries : prev.industries,
          workExperience: result.data.workExperience?.length ? result.data.workExperience : prev.workExperience,
          education: {
            degree: result.data.education?.degree || prev.education.degree,
            fieldOfStudy: result.data.education?.fieldOfStudy || prev.education.fieldOfStudy,
            institution: result.data.education?.institution || prev.education.institution,
            graduationYear: result.data.education?.graduationYear || prev.education.graduationYear,
          },
          jobTitlesSeeking: result.data.jobTitlesSeeking?.length ? result.data.jobTitlesSeeking : prev.jobTitlesSeeking,
          remotePreference: result.data.remotePreference || prev.remotePreference,
          preferredLocations: result.data.preferredLocations?.length ? result.data.preferredLocations : prev.preferredLocations,
          salaryExpectation: result.data.salaryExpectation || prev.salaryExpectation,
          coverLetterTone: result.data.coverLetterTone || prev.coverLetterTone,
        }));

        setStatus({
          kind: "extracted",
          at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      } else {
        setStatus({
          kind: "error",
          message: result.error || "Failed to extract information from resume.",
        });
      }
    } catch (err) {
      console.error("[ProfileForm] Extraction failed:", err);
      setStatus({
        kind: "error",
        message: "An unexpected error occurred during extraction.",
      });
    } finally {
      setIsExtracting(false);
    }
  }

  const completion = useMemo(() => computeCompletion(profile), [profile]);

  function patch<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function patchEducation<K extends keyof Profile["education"]>(key: K, value: Profile["education"][K]) {
    setProfile((prev) => ({ ...prev, education: { ...prev.education, [key]: value } }));
  }

  function handleResumeChange(next: Profile["resume"]) {
    if (next === null) {
      resumeClearedRef.current = true;
    } else {
      resumeClearedRef.current = false;
    }
    patch("resume", next);
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pendingFile = resumeRef.current?.getPendingFile() ?? null;
    const initialHadResume = initialProfile.resume !== null;
    const userTouchedResume = pendingFile !== null || resumeClearedRef.current;
    // Three states drive the server action: undefined = do not touch the column
    // (user did not touch the resume on this save and nothing was attached before),
    // "keep" = leave the existing URL alone, "clear" = remove the storage object
    // and null the column.
    const resumeAction: SaveProfilePayload["resumeAction"] = !userTouchedResume
      ? initialHadResume
        ? "keep"
        : undefined
      : resumeClearedRef.current
        ? "clear"
        : "keep";

    // The client-side `resume` is just a UI preview (`{ name, size }`). Strip it
    // before sending the payload to the server — the server only cares about the
    // resumeAction + the separate resumeFile argument.
    const { resume, ...rest } = profile;
    void resume;
    const payload: SaveProfilePayload = {
      fullName: rest.fullName,
      email: rest.email,
      phone: rest.phone,
      location: rest.location,
      linkedinUrl: rest.linkedinUrl,
      portfolioUrl: rest.portfolioUrl,
      workAuthorization: rest.workAuthorization,
      currentTitle: rest.currentTitle,
      experienceLevel: rest.experienceLevel,
      yearsExperience: rest.yearsExperience,
      skills: rest.skills,
      industries: rest.industries,
      workExperience: rest.workExperience,
      education: rest.education,
      jobTitlesSeeking: rest.jobTitlesSeeking,
      remotePreference: rest.remotePreference,
      preferredLocations: rest.preferredLocations,
      salaryExpectation: rest.salaryExpectation,
      coverLetterTone: rest.coverLetterTone,
      resumeAction,
    };

    startTransition(async () => {
      const result = await saveProfile(payload, pendingFile);
      if (result.ok) {
        resumeRef.current?.clearPendingFile();
        resumeClearedRef.current = false;
        setStatus({
          kind: "saved",
          at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isComplete: result.isComplete,
        });
      } else {
        setStatus({ kind: "error", message: result.message });
      }
    });
  }

  const statusMessage =
    status.kind === "saved"
      ? status.isComplete
        ? `Saved at ${status.at}. Your profile is complete — matching is ready to go.`
        : `Saved at ${status.at}. A few fields are still missing.`
      : status.kind === "extracted"
        ? `Successfully extracted from resume at ${status.at}. Please review and save changes.`
        : status.kind === "error"
          ? status.message
          : "Changes are not saved yet.";

  const statusTone =
    status.kind === "error"
      ? "text-error"
      : status.kind === "saved" || status.kind === "extracted"
        ? "text-success-darker"
        : "text-text-muted";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <AttentionBanner
        percentage={completion.percentage}
        missing={completion.missing}
        isComplete={completion.isComplete}
      />

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-[16px] font-semibold text-text-primary">Resume</h2>
          <p className="mt-1 text-sm text-text-muted">
            Keep your most recent resume here. We will use it to tailor and to ground company research.
          </p>
          <div className="mt-4">
            <ResumeSection
              ref={resumeRef}
              resume={profile.resume}
              onChange={handleResumeChange}
              onExtract={handleExtract}
              isExtracting={isExtracting}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="space-y-8">
            <div>
              <h2 className="text-[16px] font-semibold text-text-primary">Personal Info</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Full Name</span>
                  <input
                    className={inputClass}
                    placeholder="Full Name"
                    value={profile.fullName}
                    onChange={(event) => patch("fullName", event.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Email</span>
                  <input
                    className="w-full cursor-not-allowed rounded-md border border-border bg-surface-secondary px-4 py-3 text-sm text-text-muted"
                    placeholder="Email"
                    value={profile.email}
                    disabled
                    readOnly
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Phone Number</span>
                  <input
                    className={inputClass}
                    placeholder="+1 555 123 4567"
                    value={profile.phone}
                    onChange={(event) => patch("phone", event.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Location</span>
                  <input
                    className={inputClass}
                    placeholder="City, State"
                    value={profile.location}
                    onChange={(event) => patch("location", event.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">LinkedIn URL</span>
                  <input
                    className={inputClass}
                    placeholder="https://linkedin.com/in/your-handle"
                    value={profile.linkedinUrl}
                    onChange={(event) => patch("linkedinUrl", event.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Portfolio / GitHub</span>
                  <input
                    className={inputClass}
                    placeholder="https://github.com/your-handle"
                    value={profile.portfolioUrl}
                    onChange={(event) => patch("portfolioUrl", event.target.value)}
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Work Authorization</span>
                  <select
                    className={inputClass}
                    value={profile.workAuthorization}
                    onChange={(event) => patch("workAuthorization", event.target.value)}
                  >
                    {WORK_AUTHORIZATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div>
              <h2 className="text-[16px] font-semibold text-text-primary">Professional Info</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Current Job Title</span>
                  <input
                    className={inputClass}
                    placeholder="Senior Frontend Engineer"
                    value={profile.currentTitle}
                    onChange={(event) => patch("currentTitle", event.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Experience Level</span>
                  <select
                    className={inputClass}
                    value={profile.experienceLevel}
                    onChange={(event) => patch("experienceLevel", event.target.value)}
                  >
                    {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Years of Experience</span>
                  <input
                    className={inputClass}
                    placeholder="4"
                    inputMode="numeric"
                    value={profile.yearsExperience}
                    onChange={(event) => patch("yearsExperience", event.target.value.replace(/[^0-9]/g, ""))}
                  />
                </label>
                <div />
                <TagInput
                  label="Skills"
                  values={profile.skills}
                  onChange={(skills) => patch("skills", skills)}
                  placeholder="React, TypeScript, Node"
                />
                <TagInput
                  label="Industries"
                  values={profile.industries}
                  onChange={(industries) => patch("industries", industries)}
                  placeholder="Fintech, SaaS"
                />
              </div>
            </div>

            <div>
              <h2 className="text-[16px] font-semibold text-text-primary">Work Experience</h2>
              <div className="mt-4">
                <WorkExperienceList
                  roles={profile.workExperience}
                  onChange={(workExperience) => patch("workExperience", workExperience)}
                />
              </div>
            </div>

            <div>
              <h2 className="text-[16px] font-semibold text-text-primary">Education</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Highest Degree</span>
                  <select
                    className={inputClass}
                    value={profile.education.degree}
                    onChange={(event) => patchEducation("degree", event.target.value)}
                  >
                    {DEGREE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Field of Study</span>
                  <input
                    className={inputClass}
                    placeholder="Computer Science"
                    value={profile.education.fieldOfStudy}
                    onChange={(event) => patchEducation("fieldOfStudy", event.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Institution Name</span>
                  <input
                    className={inputClass}
                    placeholder="State University"
                    value={profile.education.institution}
                    onChange={(event) => patchEducation("institution", event.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Graduation Year</span>
                  <input
                    className={inputClass}
                    placeholder="2018"
                    inputMode="numeric"
                    maxLength={4}
                    value={profile.education.graduationYear}
                    onChange={(event) => patchEducation("graduationYear", event.target.value.replace(/[^0-9]/g, ""))}
                  />
                </label>
              </div>
            </div>

            <div>
              <h2 className="text-[16px] font-semibold text-text-primary">Job Preferences</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TagInput
                  label="Job Titles Seeking"
                  values={profile.jobTitlesSeeking}
                  onChange={(jobTitlesSeeking) => patch("jobTitlesSeeking", jobTitlesSeeking)}
                  placeholder="Frontend Engineer, UI Engineer"
                />
                <label className="space-y-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Remote Preference</span>
                  <select
                    className={inputClass}
                    value={profile.remotePreference}
                    onChange={(event) => patch("remotePreference", event.target.value)}
                  >
                    {REMOTE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Salary Expectation</span>
                  <input
                    className={inputClass}
                    placeholder="$140k - $180k"
                    value={profile.salaryExpectation}
                    onChange={(event) => patch("salaryExpectation", event.target.value)}
                  />
                </label>
                <TagInput
                  label="Preferred Locations"
                  values={profile.preferredLocations}
                  onChange={(preferredLocations) => patch("preferredLocations", preferredLocations)}
                  placeholder="Remote, New York"
                />
                <label className="space-y-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Cover Letter Tone</span>
                  <select
                    className={inputClass}
                    value={profile.coverLetterTone}
                    onChange={(event) => patch("coverLetterTone", event.target.value)}
                  >
                    {TONE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-6">
              <p className={`text-[12px] ${statusTone}`} role={status.kind === "error" ? "alert" : undefined}>
                {isSaving ? "Saving your profile..." : isExtracting ? "Extracting profile details from resume..." : statusMessage}
              </p>
              <button
                type="submit"
                disabled={isSaving || isExtracting}
                className="rounded-md bg-accent px-5 py-3 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </form>
  );
}
