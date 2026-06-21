type ActivityItem = {
  title: string;
  time: string;
  tone: "accent" | "info" | "success";
};

type RecentActivityProps = {
  items: ActivityItem[];
};

// Maps an activity tone to the inner-dot color token. The outer ring uses the
// matching {tone}-light variant so each dot reads as the same family as its
// status badges on the find-jobs and job-details pages.
function dotClasses(tone: ActivityItem["tone"]): string {
  if (tone === "success") return "bg-success-alt";
  if (tone === "info") return "bg-info";
  return "bg-accent";
}

function ringClasses(tone: ActivityItem["tone"]): string {
  if (tone === "success") return "bg-success-light";
  if (tone === "info") return "bg-info-light";
  return "bg-accent-light";
}

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-6 py-5 text-[16px] font-semibold text-text-primary">
        Recent Activity
      </div>
      <div className="px-6 py-6">
        {items.length === 0 ? (
          <p className="text-[14px] text-text-muted">
            No activity yet. Find a few jobs or research a company and it will show up here.
          </p>
        ) : (
          <div className="space-y-5">
            {items.map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <span
                  className={`mt-1 grid size-4 shrink-0 place-items-center rounded-full ${ringClasses(item.tone)}`}
                  aria-hidden="true"
                >
                  <span className={`size-2 rounded-full ${dotClasses(item.tone)}`} />
                </span>
                <div>
                  <p className="text-[14px] font-medium text-text-primary">{item.title}</p>
                  <p className="mt-1 text-[12px] text-text-muted">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
