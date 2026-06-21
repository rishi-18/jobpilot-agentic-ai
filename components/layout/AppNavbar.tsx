import Link from "next/link";

import { NavbarAccountButton } from "@/app/navbar-account-button";
import { UserSessionSync } from "@/app/user-session-sync";

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
} | null;

type AppNavbarProps = {
  user: SessionUser;
  activeNav: "dashboard" | "find-jobs" | "profile";
};

const NAV_ITEMS: { key: AppNavbarProps["activeNav"]; href: string; label: string }[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard" },
  { key: "find-jobs", href: "/find-jobs", label: "Find Jobs" },
  { key: "profile", href: "/profile", label: "Profile" },
];

export function AppNavbar({ user, activeNav }: AppNavbarProps) {
  const accountLabel = user?.name?.trim() || user?.email || "Account";

  return (
    <>
      <UserSessionSync user={user} />
      <header className="flex h-20 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground shadow-[0_8px_24px_rgba(124,92,252,0.24)]">
            <span className="text-sm font-semibold">J</span>
          </span>
          <span className="text-[19px] font-semibold tracking-[-0.03em] text-text-darkest">JobPilot</span>
        </div>

        <nav className="flex items-center gap-12 text-sm font-medium text-text-dark">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={item.key === activeNav ? "text-accent" : "transition-colors hover:text-accent"}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <NavbarAccountButton label={accountLabel} />
      </header>
    </>
  );
}
