import type { ReactNode } from "react";

import { AppNavbar } from "@/components/layout/AppNavbar";

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
} | null;

type AppShellProps = {
  user: SessionUser;
  activeNav: "dashboard" | "find-jobs" | "profile";
  children: ReactNode;
};

// Shared shell used by every authenticated page. Hosts the top navbar and the
// 1440px-wide surface that wraps the page content. Individual pages only render
// their section/card stack inside the shell.
export function AppShell({ user, activeNav, children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-8 pb-8">
        <AppNavbar user={user} activeNav={activeNav} />
        <section className="border-x border-border bg-surface px-8 py-8">{children}</section>
      </div>
    </main>
  );
}
