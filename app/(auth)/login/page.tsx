import Link from "next/link";

import { signInWithGitHub, signInWithGoogle } from "@/actions/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  oauth: "We could not complete sign in. Please try again.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorKey = params?.error ?? "";
  const errorMessage = errorMessages[errorKey] ?? null;

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-text-primary">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1440px] items-center justify-center">
        <section className="w-full max-w-[560px] rounded-2xl border border-border bg-surface p-8 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground shadow-[0_8px_24px_rgba(124,92,252,0.24)]">
              <span className="text-sm font-semibold">J</span>
            </span>
            <div>
              <p className="text-[19px] font-semibold tracking-[-0.03em] text-text-darkest">JobPilot</p>
              <p className="text-sm text-text-secondary">Sign in to your workspace</p>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-[32px] font-semibold tracking-[-0.04em] text-text-primary">
              Continue with Google or GitHub
            </h1>
            <p className="text-sm leading-6 text-text-secondary">
              Use your preferred account to start finding and researching jobs.
            </p>
          </div>

          {errorMessage ? (
            <div className="mt-6 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-8 space-y-3">
            <form action={signInWithGoogle}>
              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-surface-secondary"
              >
                Continue with Google
              </button>
            </form>

            <form action={signInWithGitHub}>
              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-md bg-overlay px-4 py-3 text-sm font-medium text-surface shadow-sm transition-colors hover:bg-overlay/90"
              >
                Continue with GitHub
              </button>
            </form>
          </div>

          <p className="mt-6 text-sm leading-6 text-text-muted">
            By continuing, you agree to use JobPilot to search, score, and research jobs on your behalf.
          </p>

          <div className="mt-8 border-t border-border pt-6 text-sm text-text-secondary">
            <Link href="/" className="transition-colors hover:text-accent">
              Back to homepage
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}