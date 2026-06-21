// Default Profile shape used when the InsForge `profiles` row for the current
// user is missing. Feature 06 owns the live read on the server; this helper
// only seeds the form so the page still renders before the first save.

import { type Profile } from "./profile-mock";

export function emptyProfile(email: string): Profile {
  return {
    fullName: "",
    email,
    phone: "",
    location: "",
    linkedinUrl: "",
    portfolioUrl: "",
    workAuthorization: "",
    currentTitle: "",
    experienceLevel: "",
    yearsExperience: "",
    skills: [],
    industries: [],
    workExperience: [],
    education: {
      degree: "",
      fieldOfStudy: "",
      institution: "",
      graduationYear: "",
    },
    jobTitlesSeeking: [],
    remotePreference: "",
    preferredLocations: [],
    salaryExpectation: "",
    coverLetterTone: "",
    resume: null,
  };
}

