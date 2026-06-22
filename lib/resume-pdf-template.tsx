import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Profile } from "./profile-mock";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    lineHeight: 1.4,
    color: "#2c3e50",
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#7c5cfc", // JobPilot primary accent color
    paddingBottom: 10,
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    marginBottom: 2,
  },
  title: {
    fontSize: 12,
    fontFamily: "Helvetica",
    color: "#7c5cfc",
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    color: "#64748b",
    fontSize: 8.5,
  },
  contactSeparator: {
    color: "#cbd5e1",
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 2,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryText: {
    color: "#334155",
    fontSize: 9,
    lineHeight: 1.5,
  },
  jobEntry: {
    marginBottom: 8,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    fontSize: 9.5,
    marginBottom: 1,
  },
  jobCompany: {
    color: "#64748b",
    fontFamily: "Helvetica",
    fontSize: 8.5,
  },
  jobDate: {
    color: "#64748b",
    fontFamily: "Helvetica",
    fontSize: 8.5,
  },
  bulletList: {
    marginLeft: 8,
    marginTop: 3,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletPoint: {
    width: 6,
    color: "#7c5cfc",
    fontSize: 9,
  },
  bulletContent: {
    flex: 1,
    color: "#334155",
    fontSize: 8.5,
    lineHeight: 1.35,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  skillBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 3,
    fontSize: 8,
    color: "#334155",
  },
  eduEntry: {
    marginBottom: 5,
  },
  eduHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    fontSize: 9,
  },
  eduInstitution: {
    color: "#64748b",
    fontFamily: "Helvetica",
    fontSize: 8.5,
  },
});

function formatDegree(degree: string): string {
  switch (degree.toLowerCase()) {
    case "associate":
      return "Associate Degree";
    case "bachelors":
      return "Bachelor's Degree";
    case "masters":
      return "Master's Degree";
    case "doctorate":
      return "Doctoral Degree";
    default:
      return degree;
  }
}

interface ResumePdfDocumentProps {
  profile: Profile;
  polishedSummary: string;
  polishedExperiences: Array<{
    company: string;
    title: string;
    bullets: string[];
  }>;
}

export function ResumePdfDocument({
  profile,
  polishedSummary,
  polishedExperiences,
}: ResumePdfDocumentProps) {
  // Map experiences to matching AI bullets or fall back to raw descriptions split by lines
  const displayExperiences = profile.workExperience.map((exp, idx) => {
    const aiMatch = polishedExperiences.find(
      (pe) =>
        pe.company.toLowerCase() === exp.company.toLowerCase() ||
        pe.title.toLowerCase() === exp.title.toLowerCase() ||
        idx === polishedExperiences.indexOf(pe),
    );

    let bullets: string[] = [];
    if (aiMatch && aiMatch.bullets.length > 0) {
      bullets = aiMatch.bullets;
    } else {
      // Fallback: parse raw description line by line
      bullets = exp.responsibilities
        .split("\n")
        .map((line: string) => line.trim().replace(/^-\s*/, ""))
        .filter((line: string) => line.length > 0);
    }

    return {
      ...exp,
      bullets,
    };
  });

  const contactItems = [
    profile.email,
    profile.phone,
    profile.location,
    profile.linkedinUrl,
    profile.portfolioUrl,
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.name}>{profile.fullName || "Candidate Name"}</Text>
          <Text style={styles.title}>
            {profile.currentTitle || "Professional Professional"}
          </Text>
          <View style={styles.contactRow}>
            {contactItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <Text style={styles.contactSeparator}>|</Text>}
                <Text>{item}</Text>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Professional Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Summary</Text>
          <Text style={styles.summaryText}>
            {polishedSummary ||
              `Experienced professional skilled in ${profile.skills.slice(0, 5).join(", ")}. Seeking new opportunities in ${profile.industries.join(", ")}.`}
          </Text>
        </View>

        {/* Work Experience */}
        {displayExperiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {displayExperiences.map((exp, idx) => (
              <View key={idx} style={styles.jobEntry}>
                <View style={styles.jobHeader}>
                  <Text>{exp.title}</Text>
                  <Text style={styles.jobDate}>
                    {exp.startDate} – {exp.currentlyWorking ? "Present" : exp.endDate || "N/A"}
                  </Text>
                </View>
                <Text style={styles.jobCompany}>{exp.company}</Text>
                <View style={styles.bulletList}>
                  {exp.bullets.map((bullet, bIdx) => (
                    <View key={bIdx} style={styles.bulletItem}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.bulletContent}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {profile.education && profile.education.institution && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            <View style={styles.eduEntry}>
              <View style={styles.eduHeader}>
                <Text>
                  {profile.education.degree ? `${formatDegree(profile.education.degree)} in ` : ""}
                  {profile.education.fieldOfStudy || "Major"}
                </Text>
                <Text style={styles.jobDate}>
                  Class of {profile.education.graduationYear || "N/A"}
                </Text>
              </View>
              <Text style={styles.eduInstitution}>{profile.education.institution}</Text>
            </View>
          </View>
        )}

        {/* Skills */}
        {profile.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills & Expertise</Text>
            <View style={styles.skillsContainer}>
              {profile.skills.map((skill, idx) => (
                <Text key={idx} style={styles.skillBadge}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
