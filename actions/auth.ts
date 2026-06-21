"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { createAuthActions, clearAuthCookies } from "@insforge/sdk/ssr";

async function getCallbackUrl(): Promise<string> {
  const headerList = await headers();
  const origin = (headerList.get("origin") ?? "http://localhost:3000").trim();
  return new URL("/api/auth/callback", origin).toString();
}

async function startOAuth(provider: "google" | "github") {
  const cookieStore = await cookies();
  const auth = createAuthActions({ cookies: cookieStore });
  const { data, error } = await auth.signInWithOAuth(provider, {
    redirectTo: await getCallbackUrl(),
    skipBrowserRedirect: true,
  });

  if (error || !data?.url || !data.codeVerifier) {
    redirect("/login?error=oauth");
  }

  cookieStore.set("insforge_code_verifier", data.codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  redirect(data.url);
}

export async function signInWithGoogle() {
  return startOAuth("google");
}

export async function signInWithGitHub() {
  return startOAuth("github");
}

export async function signOut() {
  const cookieStore = await cookies();
  const auth = createAuthActions({ cookies: cookieStore });
  // Best-effort remote sign-out — local cookie cleanup always runs so we never strand the UI.
  await auth.signOut();
  clearAuthCookies(cookieStore);
  redirect("/");
}
