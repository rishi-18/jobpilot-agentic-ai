import type { ReactNode } from "react";

type AnalyticsChartsProps = {
  jobTrends: number[];
  tailoringTrends: number[];
  distribution: number[];
};

export function AnalyticsCharts({ jobTrends, tailoringTrends, distribution }: AnalyticsChartsProps) {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <JobsFoundOverTime data={jobTrends} />
      <ResumeTailoringActivity data={tailoringTrends} />
      <MatchScoreDistribution data={distribution} />
    </div>
  );
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function JobsFoundOverTime({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (v / max) * 100;
    return [x, y] as const;
  });
  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${path} L100,100 L0,100 Z`;

  return (
    <ChartCard title="Jobs Found Over Time">
      <div className="flex h-[220px] items-end gap-3 pt-6">
        <div className="relative h-full flex-1">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="dashboard-line-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 25, 50, 75].map((y) => (
              <line
                key={y}
                x1="0"
                x2="100"
                y1={y}
                y2={y}
                stroke="var(--color-border)"
                strokeWidth="0.2"
                strokeDasharray="1,1"
              />
            ))}
            <path d={areaPath} fill="url(#dashboard-line-fill)" />
            <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round" />
            {points.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="0.9" fill="var(--color-accent)" />
            ))}
          </svg>
        </div>
      </div>
      <WeekdayAxis data={data} />
    </ChartCard>
  );
}

function ResumeTailoringActivity({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);

  return (
    <ChartCard title="Resume Tailoring Activity">
      <div className="flex h-[220px] items-end gap-3 pt-6">
        {data.map((v, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div
              className="w-full rounded-t-md bg-info-medium"
              style={{ height: `${(v / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <WeekdayAxis data={data} />
    </ChartCard>
  );
}

function MatchScoreDistribution({ data }: { data: number[] }) {
  const labels = ["50-60%", "60-70%", "70-80%", "80-90%", "90-100%"];
  const max = Math.max(...data, 1);
  // Match score bars color-step from warning -> info -> success across the ranges.
  const fill = ["bg-warning", "bg-info-medium", "bg-info-medium", "bg-success", "bg-success"];

  return (
    <ChartCard title="Match Score Distribution">
      <div className="space-y-4 pt-6">
        {data.map((value, i) => (
          <div key={labels[i]} className="flex items-center gap-4">
            <span className="w-20 text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">
              {labels[i]}
            </span>
            <div className="h-2 flex-1 rounded-full bg-border">
              <div
                className={`h-2 rounded-full ${fill[i]}`}
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
            <span className="w-8 text-right text-[12px] text-text-muted">{value}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-6 py-5 text-[16px] font-semibold text-text-primary">
        {title}
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

function WeekdayAxis({ data }: { data: number[] }) {
  return (
    <div className="mt-3 flex gap-3">
      {data.map((_, i) => (
        <span
          key={i}
          className="flex-1 text-center text-[12px] font-medium text-text-muted"
        >
          {WEEKDAYS[i] ?? ""}
        </span>
      ))}
    </div>
  );
}
