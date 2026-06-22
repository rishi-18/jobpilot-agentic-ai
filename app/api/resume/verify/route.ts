import "@/agent/polyfill";
import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import path from "path";
import { pathToFileURL } from "url";

import { createInsforgeServer } from "@/lib/insforge-server";

export async function GET(req: NextRequest) {
  try {
    const insforge = await createInsforgeServer();
    const {
      data: { user },
    } = await insforge.auth.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch current profile from database
    const { data: profile, error: dbError } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (dbError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 2. Fetch the generated PDF from storage (resolving key dynamically from URL if available)
    let objectPath = `${user.id}/resume.pdf`;
    if (profile.resume_pdf_url) {
      try {
        const urlObj = new URL(profile.resume_pdf_url);
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
        console.warn("[verify] failed to parse resume_pdf_url:", err);
      }
    }

    console.log("[verify] downloading PDF using resolved key:", objectPath);
    const { data: fileData, error: downloadError } = await insforge.storage
      .from("resumes")
      .download(objectPath);

    if (downloadError || !fileData) {
      return NextResponse.json({
        error: "Failed to download resume PDF from storage",
        details: downloadError,
      }, { status: 404 });
    }

    // 3. Extract text from the PDF buffer using PDFParse
    const pdfBuffer = Buffer.from(await fileData.arrayBuffer());
    let parser: PDFParse | null = null;
    let text = "";

    try {
      const workerPath = path.resolve(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
      PDFParse.setWorker(pathToFileURL(workerPath).href);
    } catch (workerErr) {
      console.warn("[verify] failed to set pdf worker path:", workerErr);
    }

    try {
      parser = new PDFParse({ data: new Uint8Array(pdfBuffer), disableWorker: true } as any);
      const pdfData = await parser.getText();
      text = pdfData.text?.trim() || "";
    } catch (err: any) {
      return NextResponse.json({ error: "Failed to parse PDF text", details: err.message }, { status: 500 });
    } finally {
      if (parser) {
        await parser.destroy().catch(() => {});
      }
    }

    // 4. Perform content verification checks
    const nameMatches = profile.full_name ? text.toLowerCase().includes(profile.full_name.toLowerCase()) : false;
    const titleMatches = profile.current_title ? text.toLowerCase().includes(profile.current_title.toLowerCase()) : false;
    const emailMatches = profile.email ? text.toLowerCase().includes(profile.email.toLowerCase()) : false;

    // Check work experience presence
    const experienceChecks = (profile.work_experience || []).map((exp: any) => {
      const companyMatches = exp.company ? text.toLowerCase().includes(exp.company.toLowerCase()) : false;
      const roleMatches = exp.title ? text.toLowerCase().includes(exp.title.toLowerCase()) : false;
      return {
        company: exp.company,
        role: exp.title,
        companyFound: companyMatches,
        roleFound: roleMatches,
      };
    });

    // Check skills presence
    const skillChecks = (profile.skills || []).map((skill: string) => {
      return {
        skill,
        found: text.toLowerCase().includes(skill.toLowerCase()),
      };
    });

    // Check education
    const eduMatches = profile.education?.institution
      ? text.toLowerCase().includes(profile.education.institution.toLowerCase())
      : false;

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        profileData: {
          fullName: profile.full_name,
          currentTitle: profile.current_title,
          email: profile.email,
          skills: profile.skills,
          workExperience: profile.work_experience,
          education: profile.education,
          resumePdfUrl: profile.resume_pdf_url,
        },
        pdfVerification: {
          textSnippet: text.substring(0, 500) + "...",
          textTotalLength: text.length,
          checks: {
            nameMatches,
            titleMatches,
            emailMatches,
            educationMatches: eduMatches,
          },
          workExperience: experienceChecks,
          skills: skillChecks,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Unexpected error", details: error.message }, { status: 500 });
  }
}
