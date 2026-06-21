"use client";

import { useState, type KeyboardEvent } from "react";

type Props = {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
};

export function TagInput({ label, values, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState("");

  function commit() {
    const next = draft.trim();
    if (!next) return;
    if (values.includes(next)) {
      setDraft("");
      return;
    }
    onChange([...values, next]);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  function remove(value: string) {
    onChange(values.filter((v) => v !== value));
  }

  return (
    <div className="space-y-2">
      <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">{label}</span>
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-3 py-1 text-[12px] font-medium text-accent"
          >
            {value}
            <button
              type="button"
              onClick={() => remove(value)}
              className="grid size-4 place-items-center rounded-full text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label={`Remove ${value}`}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        ))}
        <input
          className="min-w-[8ch] flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          placeholder={values.length === 0 ? placeholder : ""}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
        />
      </div>
      <p className="text-[12px] text-text-muted">Press Enter or comma to add. Backspace removes the last tag.</p>
    </div>
  );
}