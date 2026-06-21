"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

type UserSessionSyncProps = {
  user: SessionUser | null;
};

// Mirrors the server-side session into PostHog so person_profiles="identified_only"
// actually attaches events to a user. Runs once per user change; bails out cleanly
// when there is no session so anonymous visitors are not pinned to a stale identity.
export function UserSessionSync({ user }: UserSessionSyncProps) {
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog || !posthog.__loaded) return;

    if (!user) {
      posthog.reset();
      return;
    }

    const traits: Record<string, string> = {};
    if (user.email) traits.email = user.email;
    if (user.name) traits.name = user.name;

    posthog.identify(user.id, traits);
  }, [posthog, user?.id, user?.email, user?.name]);

  return null;
}
