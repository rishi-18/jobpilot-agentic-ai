import { NextRequest, NextResponse } from "next/server";

import { createInsforgeServer } from "@/lib/insforge-server";
import { extractProfileFromPdf } from "@/agent/extractor";

function getResumeObjectPath(resumePdfUrl: string): string | null {
  try {
    const parsedUrl = new URL(resumePdfUrl);
    const objectsIndex = parsedUrl.pathname.indexOf("/objects/");
    if (objectsIndex === -1) {
      return null;
    }

    const encodedPath = parsedUrl.pathname.slice(objectsIndex + "/objects/".length);
    return decodeURIComponent(encodedPath);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const insforge = await createInsforgeServer();
    const {
      data: { user },
    } = await insforge.auth.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "You must be logged in to extract from a resume." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("resume") as File | null;
    let buffer: Buffer;

    if (!file) {
      const { data: profileRow } = await insforge.database
        .from("profiles")
        .select("resume_pdf_url")
        .eq("id", user.id)
        .maybeSingle();

      const resumePdfUrl = (profileRow as { resume_pdf_url?: string | null } | null)?.resume_pdf_url;
      if (!resumePdfUrl) {
        return NextResponse.json(
          { success: false, error: "No resume file provided and no existing resume found." },
          { status: 400 }
        );
      }

      try {
        const objectPath = getResumeObjectPath(resumePdfUrl);
        if (!objectPath) {
          throw new Error(`Could not derive a storage object path from ${resumePdfUrl}`);
        }

        const { data: resumeBlob, error: downloadError } = await insforge.storage
          .from("resumes")
          .download(objectPath);

        if (downloadError || !resumeBlob) {
          throw downloadError ?? new Error(`Failed to download stored resume at ${objectPath}`);
        }

        const arrayBuffer = await resumeBlob.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } catch (fetchErr) {
        console.error("[api/resume/extract] failed to fetch existing resume:", fetchErr);
        return NextResponse.json(
          { success: false, error: "We could not read your stored resume. Please re-upload the file and try again." },
          { status: 400 }
        );
      }
    } else {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "Resume file size exceeds the 10 MB limit." },
          { status: 400 }
        );
      }
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    const extractionResult = await extractProfileFromPdf(buffer, user.id);

    if (!extractionResult.success) {
      return NextResponse.json(
        { success: false, error: extractionResult.error || "Failed to extract profile." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: extractionResult.data,
    });
  } catch (error) {
    console.error("[api/resume/extract] unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during extraction." },
      { status: 500 }
    );
  }
}
