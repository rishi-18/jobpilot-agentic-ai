"use client";

import { useRef, type MouseEvent } from "react";

import { signOut } from "@/actions/auth";

type NavbarAccountButtonProps = {
  label: string;
};

export function NavbarAccountButton({ label }: NavbarAccountButtonProps) {
  // The visible trigger posts the server action. Confirmation is handled
  // client-side so the rest of the navbar stays a Server Component and the
  // session cookie clearing still happens on the server in actions/auth.ts.
  const buttonRef = useRef<HTMLButtonElement>(null);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm("Log out of JobPilot?")) {
      event.preventDefault();
    }
  }

  return (
    <form action={signOut}>
      <button
        ref={buttonRef}
        type="submit"
        onClick={handleClick}
        title={label}
        className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
      >
        <span
          aria-hidden="true"
          className="grid size-6 place-items-center rounded-full bg-accent-muted text-[11px] font-semibold uppercase text-accent"
        >
          {label.slice(0, 1)}
        </span>
        <span>Log out</span>
      </button>
    </form>
  );
}