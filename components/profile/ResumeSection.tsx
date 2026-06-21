"use client";

import { forwardRef, useImperativeHandle, useRef, useState, type DragEvent, type ChangeEvent } from "react";

import type { ResumeFile } from "@/lib/profile-mock";

export type ResumeSectionHandle = {
  // Returns the pending File the user just picked, or null when the preview
  // exists from a previous save (no fresh File to upload) or when nothing is
  // attached. The form passes this into the saveProfile server action.
  getPendingFile: () => File | null;
  clearPendingFile: () => void;
};

type Props = {
  resume: ResumeFile | null;
  onChange: (resume: ResumeFile | null) => void;
  onExtract?: () => void;
  isExtracting?: boolean;
};

const MAX_BYTES = 10 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ResumeSection = forwardRef<ResumeSectionHandle, Props>(function ResumeSection(
  { resume, onChange, onExtract, isExtracting },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    getPendingFile: () => fileRef.current,
    clearPendingFile: () => {
      fileRef.current = null;
    },
  }));

  function acceptFile(file: File | null | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("PDF only. Please pick a PDF resume.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That file is too large. Keep it under 10 MB.");
      return;
    }
    setError(null);
    fileRef.current = file;
    onChange({ name: file.name, size: file.size });
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.target.files?.[0]);
    // Allow re-selecting the same file later
    event.target.value = "";
  }

  function clear() {
    setError(null);
    fileRef.current = null;
    onChange(null);
  }

  return (
    <div className="space-y-4">
      <label
        htmlFor="resume-upload"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-surface-secondary px-6 py-10 text-center transition-colors ${
          isDragging ? "border-accent bg-accent-muted" : "border-border"
        }`}
      >
        <div className="grid size-12 place-items-center rounded-full bg-accent-muted text-accent">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 16V4M12 4L7 9M12 4L17 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <p className="mt-4 text-[15px] font-medium text-text-primary">Click to upload or drag and drop</p>
        <p className="mt-1 text-sm text-text-muted">PDF only — up to 10 MB</p>
        <input
          ref={inputRef}
          id="resume-upload"
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleSelect}
          className="sr-only"
        />
      </label>

      {resume ? (
        <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-accent-muted text-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{resume.name}</p>
              {resume.size > 0 && <p className="text-[12px] text-text-muted">{formatSize(resume.size)}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={clear}
            disabled={isExtracting}
            className="rounded-md border border-border bg-surface px-3 py-2 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            Remove
          </button>
        </div>
      ) : null}

      {error ? <p className="text-[12px] text-error">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isExtracting}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resume ? "Replace Resume" : "Select Resume"}
        </button>

        {resume && onExtract && (
          <button
            type="button"
            onClick={onExtract}
            disabled={isExtracting}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExtracting ? "Extracting..." : "Extract from Resume"}
          </button>
        )}

        {/* Feature 08 — Generate Resume from Profile. Stays visible per spec but is intentionally a no-op in 05. */}
        <button
          type="button"
          disabled={isExtracting}
          onClick={() => {
            /* 08 owns this — wired to /api/resume/generate */
          }}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          Generate Resume from Profile
        </button>
      </div>
    </div>
  );
});