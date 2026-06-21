import type { Profile } from "./profile-mock";

// Required-field list. Single source of truth for the attention banner and for
// the `is_complete` flag the server will write back to the `profiles` table in
// feature 06. Keep the labels here short and uppercase so the banner tags match
// the build-plan mock ("PHONE", "LOCATION", "EDUCATION" etc.).
export const requiredFields: { key: keyof Profile; label: string; isFilled: (p: Profile) => boolean }[] = [
  { key: "fullName", label: "FULL NAME", isFilled: (p) => p.fullName.trim().length > 0 },
  { key: "phone", label: "PHONE", isFilled: (p) => p.phone.trim().length > 0 },
  { key: "location", label: "LOCATION", isFilled: (p) => p.location.trim().length > 0 },
  { key: "linkedinUrl", label: "LINKEDIN", isFilled: (p) => p.linkedinUrl.trim().length > 0 },
  { key: "workAuthorization", label: "WORK AUTH", isFilled: (p) => p.workAuthorization.trim().length > 0 },
  { key: "currentTitle", label: "CURRENT TITLE", isFilled: (p) => p.currentTitle.trim().length > 0 },
  { key: "experienceLevel", label: "EXPERIENCE", isFilled: (p) => p.experienceLevel.trim().length > 0 },
  { key: "yearsExperience", label: "YEARS", isFilled: (p) => p.yearsExperience.trim().length > 0 },
  { key: "skills", label: "SKILLS", isFilled: (p) => p.skills.length > 0 },
  { key: "workExperience", label: "WORK HISTORY", isFilled: (p) => p.workExperience.length > 0 },
  {
    key: "education",
    label: "EDUCATION",
    isFilled: (p) =>
      p.education.degree.trim().length > 0 &&
      p.education.fieldOfStudy.trim().length > 0 &&
      p.education.institution.trim().length > 0 &&
      p.education.graduationYear.trim().length > 0,
  },
  { key: "jobTitlesSeeking", label: "JOB TITLES", isFilled: (p) => p.jobTitlesSeeking.length > 0 },
  { key: "remotePreference", label: "REMOTE PREF", isFilled: (p) => p.remotePreference.trim().length > 0 },
  { key: "coverLetterTone", label: "TONE", isFilled: (p) => p.coverLetterTone.trim().length > 0 },
];

export type Completion = {
  percentage: number;
  missing: string[];
  isComplete: boolean;
};

export function computeCompletion(profile: Profile): Completion {
  const missing: string[] = [];
  for (const field of requiredFields) {
    if (!field.isFilled(profile)) missing.push(field.label);
  }
  const total = requiredFields.length;
  const filled = total - missing.length;
  const percentage = total === 0 ? 100 : Math.round((filled / total) * 100);
  return { percentage, missing, isComplete: missing.length === 0 };
}