"use client";

import type { WorkExperience } from "@/lib/profile-mock";

type Props = {
  roles: WorkExperience[];
  onChange: (roles: WorkExperience[]) => void;
};

const MAX_ROLES = 3;

function updateRole(roles: WorkExperience[], index: number, patch: Partial<WorkExperience>): WorkExperience[] {
  return roles.map((role, i) => (i === index ? { ...role, ...patch } : role));
}

export function WorkExperienceList({ roles, onChange }: Props) {
  function addRole() {
    if (roles.length >= MAX_ROLES) return;
    onChange([
      ...roles,
      { company: "", title: "", startDate: "", endDate: "", currentlyWorking: false, responsibilities: "" },
    ]);
  }

  function removeRole(index: number) {
    onChange(roles.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {roles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-secondary px-4 py-6 text-center text-sm text-text-muted">
          No work experience yet. Add your most recent role below.
        </div>
      ) : (
        roles.map((role, index) => (
          <div key={index} className="rounded-2xl border border-border bg-surface-secondary p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Company Name</span>
                <input
                  className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="Acme Inc."
                  value={role.company}
                  onChange={(event) => onChange(updateRole(roles, index, { company: event.target.value }))}
                />
              </label>
              <label className="space-y-2">
                <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Job Title</span>
                <input
                  className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="Frontend Developer"
                  value={role.title}
                  onChange={(event) => onChange(updateRole(roles, index, { title: event.target.value }))}
                />
              </label>
              <label className="space-y-2">
                <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Start Date</span>
                <input
                  type="month"
                  className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  value={role.startDate}
                  onChange={(event) => onChange(updateRole(roles, index, { startDate: event.target.value }))}
                />
              </label>
              <label className="space-y-2">
                <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">End Date</span>
                <input
                  type="month"
                  disabled={role.currentlyWorking}
                  className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-muted"
                  placeholder="Present"
                  value={role.endDate}
                  onChange={(event) => onChange(updateRole(roles, index, { endDate: event.target.value }))}
                />
              </label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                className="size-4 rounded border-border text-accent focus:ring-accent"
                checked={role.currentlyWorking}
                onChange={(event) =>
                  onChange(
                    updateRole(roles, index, {
                      currentlyWorking: event.target.checked,
                      endDate: event.target.checked ? "" : role.endDate,
                    }),
                  )
                }
              />
              <span>Currently working here</span>
            </label>
            <label className="mt-3 block space-y-2">
              <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary">Key Responsibilities</span>
              <textarea
                className="min-h-24 w-full rounded-md border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="What did you own, build, and ship?"
                value={role.responsibilities}
                onChange={(event) => onChange(updateRole(roles, index, { responsibilities: event.target.value }))}
              />
            </label>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => removeRole(index)}
                className="rounded-md border border-border bg-surface px-3 py-2 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
              >
                Remove Role
              </button>
            </div>
          </div>
        ))
      )}

      {roles.length < MAX_ROLES ? (
        <button
          type="button"
          onClick={addRole}
          className="rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
        >
          Add Role
        </button>
      ) : (
        <p className="rounded-md border border-dashed border-border bg-surface-secondary px-4 py-3 text-center text-[12px] text-text-muted">
          You can add up to {MAX_ROLES} roles. Feature 06 will let you save the rest.
        </p>
      )}
    </div>
  );
}