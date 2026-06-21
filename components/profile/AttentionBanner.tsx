type Props = {
  percentage: number;
  missing: string[];
  isComplete: boolean;
};

// Maps completion percentage to the right token for the ring stroke and the
// centre text. Mirrors the match-score colour breakpoints in ui-rules.md so
// the dashboard, find-jobs, and profile attention states share one language.
function ringTone(percentage: number): { stroke: string; text: string; label: string } {
  if (percentage >= 80) return { stroke: "stroke-success", text: "text-success-darker", label: "Looking strong" };
  if (percentage >= 50) return { stroke: "stroke-info-medium", text: "text-info-dark", label: "Almost there" };
  return { stroke: "stroke-warning", text: "text-warning", label: "Needs attention" };
}

export function AttentionBanner({ percentage, missing, isComplete }: Props) {
  const tone = ringTone(percentage);
  // SVG circumference for a 56px-radius circle, used to set the dasharray that
  // creates the progress arc. 2*pi*r ≈ 351.86.
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percentage / 100);

  return (
    <div className="rounded-2xl border border-border bg-accent-muted px-6 py-5">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <div className="relative grid size-32 place-items-center" aria-hidden="true">
            <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="fill-none stroke-border"
                strokeWidth="10"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                className={`fill-none ${tone.stroke} transition-[stroke-dashoffset] duration-500 ease-out`}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-[20px] font-semibold leading-none ${tone.text}`}>{percentage}%</span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-text-muted">complete</span>
            </div>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-accent">
              {isComplete ? "Profile is complete" : "Profile needs attention"}
            </p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{tone.label}.</p>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              Complete the fields below so matching and resume generation can use a full profile.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-muted">Missing</span>
          <div className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
            {missing.length === 0 ? (
              <span className="rounded-full bg-surface px-3 py-1 text-[12px] font-medium text-success-darker">
                All set
              </span>
            ) : (
              missing.map((field) => (
                <span
                  key={field}
                  className="rounded-full bg-surface px-3 py-1 text-[12px] font-medium text-text-secondary"
                >
                  {field}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}