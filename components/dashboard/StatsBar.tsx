import type { ReactNode } from "react";

type StatsBarProps = {
  stats: {
    label: string;
    value: string;
    delta: string;
    note: string;
  }[];
};

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  delta: string;
  note: string;
};

function StatCard({ label, value, delta, note }: StatCardProps): ReactNode {
  return (
    <article className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <p className="text-[14px] font-medium text-text-secondary">{label}</p>
      <p className="mt-3 text-[30px] font-semibold leading-[36px] tracking-[-0.02em] text-text-primary">
        {value}
      </p>
      <div className="mt-4 flex items-center gap-2">
        <span className="rounded-sm bg-success-lightest px-2 py-0.5 text-[12px] font-medium text-success-darker">
          {delta}
        </span>
        <span className="text-[12px] text-text-muted">{note}</span>
      </div>
    </article>
  );
}
