// Mock data for feature 05. Feature 06 will replace this with a real
// `createInsforgeServer().from("profiles").select(...)` read for the current
// user and pre-fill the form. Keeping the shape aligned with the `profiles`
// table (migrations/20260620172225_init.sql) so the swap is mechanical.

export type WorkExperience = {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  responsibilities: string;
};

export type Education = {
  degree: string;
  fieldOfStudy: string;
  institution: string;
  graduationYear: string;
};

export type ResumeFile = {
  name: string;
  size: number;
};

export type Profile = {
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
  workExperience: WorkExperience[];
  education: Education;
  jobTitlesSeeking: string[];
  remotePreference: string;
  preferredLocations: string[];
  salaryExpectation: string;
  coverLetterTone: string;
  resume: ResumeFile | null;
};

export const mockProfile: Profile = {
  fullName: "Jordan Lee",
  email: "jordan.lee@example.com",
  phone: "",
  location: "",
  linkedinUrl: "",
  portfolioUrl: "",
  workAuthorization: "",
  currentTitle: "Senior Frontend Engineer",
  experienceLevel: "Senior",
  yearsExperience: "6",
  skills: ["React", "TypeScript", "CSS"],
  industries: ["Fintech", "SaaS"],
  workExperience: [
    {
      company: "Acme Inc.",
      title: "Frontend Developer",
      startDate: "2022-01",
      endDate: "",
      currentlyWorking: true,
      responsibilities:
        "Lead the design system, ship the marketing site, mentor two junior engineers.",
    },
    {
      company: "Northstar Labs",
      title: "UI Engineer",
      startDate: "2019-03",
      endDate: "2021-12",
      currentlyWorking: false,
      responsibilities:
        "Built internal tooling, owned the component library, partnered with design on motion specs.",
    },
  ],
  education: {
    degree: "Bachelor's",
    fieldOfStudy: "Computer Science",
    institution: "State University",
    graduationYear: "2018",
  },
  jobTitlesSeeking: ["Frontend Engineer", "UI Engineer"],
  remotePreference: "",
  preferredLocations: [],
  salaryExpectation: "",
  coverLetterTone: "",
  resume: null,
};