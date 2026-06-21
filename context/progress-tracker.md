# Progress Tracker

Update this file after every feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:**
Phase 2 — Profile Page
**Last completed:**
06 Profile Save Logic
**Next:**
07 AI Profile Extraction from Resume

---

## Progress

### Phase 1 — Foundation

- [x] 01 Homepage
- [x] 02 Auth
- [x] 03 PostHog Initialization
- [x] 04 Database Schema

### Phase 2 — Profile Page

- [x] 05 Profile Page — Full UI
- [x] 06 Profile Save Logic
- [ ] 07 AI Profile Extraction from Resume
- [ ] 08 Resume PDF Generation from Profile

### Phase 3 — Find Jobs Page

- [x] 09 Find Jobs Page — Full UI
- [ ] 10 Adzuna Job Discovery
- [ ] 11 Filter + Sort + Pagination

### Phase 4 — Job Details Page

- [ ] 12 Job Details Page — Full UI
- [ ] 13 Company Research Agent

### Phase 5 — Dashboard

- [x] 14 Dashboard Page — Full UI
- [ ] 15 Stats Bar — Real Data
- [ ] 16 Recent Activity — Real Data
- [ ] 17 Analytics Charts — PostHog Data

---

## Decisions Made During Build

- Use `@insforge/sdk` with the `@insforge/sdk/ssr` helpers for Next.js auth instead of the unavailable `@insforge/ssr` package.
- Start OAuth in server actions, exchange the callback code in `app/api/auth/callback/route.ts`, and keep the session in cookies.
- Use `proxy.ts` with `updateSession()` to refresh auth before protected routes render in Next.js 16.
- Build the dashboard, find jobs, and profile pages as mock-data first before wiring any DB or agent logic.
- Pass `userId`, `email`, and `name` from the server session into a client `<UserSessionSync>` so PostHog `identify` runs with `person_profiles: "identified_only"`. Reset on sign-out so anonymous visitors do not inherit a stale identity.
- `signOut()` is a server action that calls `auth.signOut()` and then `clearAuthCookies(cookieStore)` before redirecting to `/`, so the cookie store and PostHog session clear together.
- `lib/posthog-server.ts` exposes a `shutdownPostHog()` helper alongside the singleton so future server-side `posthog.capture(...)` callers can `await shutdownPostHog()` at the end of the same function. Without it the short-lived Next.js server runtime drops the event before flush.
- Apply the JobPilot database schema as a single idempotent SQL migration (`migrations/20260620172225_init.sql`) via the InsForge CLI (`insforge db migrations up --all`) against the `Rishi_backend` project. The CLI insists on timestamped names under a top-level `migrations/` directory at the repo root, so the originally planned `db/migrations/0001_init.sql` layout was abandoned — the live, tracked copy lives under `migrations/`.
- Provision the `resumes` storage bucket as private (`insforge storage create-bucket resumes --private`) so resume URLs are never publicly listable. Bucket creation is intentionally one-shot — never recreate over an existing bucket that holds user resumes.
- Enum-style fields (`experience_level`, `cover_letter_tone`, `remote_preference`, `work_authorization`, `agent_runs.status`, `agent_logs.level`, `jobs.source`, `jobs.job_type`) use CHECK constraints rather than Postgres ENUMs to keep values easy to extend without a migration.
- `jobs` ships with reserved tailored-artifact columns (`tailored_resume_url`, `tailored_cover_letter_url`, `tailored_at`) so Phase 6 doesn't need a schema change to write tailored outputs.
- RLS is owner-only on every table using `auth.uid() = user_id` (or `auth.uid() = id` for `profiles`). No service-role bypass, no cross-user reads — server writes go through the cookie-scoped `createServerClient` which always carries the calling user's JWT.
- For feature 05 the profile form lives in a single client component (`components/profile/ProfileForm.tsx`) that owns all form state via `useState<Profile>`. The page entry stays a server component that only resolves the session and the navbar. This keeps the 06 server action a one-line swap on the form's `onSubmit`.
- `lib/profile-mock.ts` still mirrors the `profiles` table shape — but as of 06, `lib/profile-empty.ts` is the factory the page and server action actually use. `profile-mock.ts` is kept so the `Profile` type, `WorkExperience`, `Education`, and `ResumeFile` shapes stay in one place for the form, and `mockProfile` is no longer imported anywhere.
- `lib/profile-completeness.ts` is the single source of truth for which fields are required, the percentage, and the missing-tag labels. `AttentionBanner`, the `app/profile/page.tsx` read, and the `actions/profile.ts` server action all call `computeCompletion(profile)` so the UI banner and the persisted `is_complete` flag can never drift.
- Removed the unused `jobTitlesDraft` and `preferredLocationsDraft` `useState` calls from `ProfileForm` that were left over from an earlier tag-input draft. Tag inputs commit through `TagInput` (Enter / comma / blur), so no separate draft state is needed.
- The navbar account button is now a client component that gates `signOut` behind a `window.confirm` prompt and shows the label as `Log out` instead of the user`s name/email. The full label is still surfaced via the `title` tooltip and the leading avatar pill. Cookie clearing and the redirect home stay in `actions/auth.ts`, so the server still owns the session teardown.
- `lib/profile-empty.ts` is the new factory for the empty `Profile` shape, used by both `app/profile/page.tsx` (when the user has no `profiles` row yet) and `actions/profile.ts` (when computing `is_complete`). Replaces the previous `mockProfile` seed so the form always starts from the same baseline.
- `actions/profile.ts` is the `saveProfile` server action. It re-reads the prior row, uploads the resume to `resumes/{user_id}/resume.pdf` (or removes it on clear), upserts every column from the form payload, and computes `is_complete` via `computeCompletion` so the persisted flag and the banner stay in sync. `revalidatePath('/profile')` runs on success.
- PostHog `profile_completed` fires server-side exactly once on the false -> true flip of `is_complete`. The server action reads the prior row inside the same call so the event is observed exactly once even under repeat saves. `await shutdownPostHog()` runs in a `finally` so the short-lived Next.js Node runtime does not drop the event.
- `app/profile/page.tsx` is now a live read against `profiles` (filtered by `auth.uid()`), with `email` always layered from the auth session so the disabled email field shows the current identity. Empty rows fall back to `emptyProfile(email)`.
- `components/profile/ResumeSection.tsx` now holds the picked `File` in a `useRef` and exposes it via `forwardRef` + `useImperativeHandle`. The form pulls the `File` on submit and clears the ref after a successful save.
- `components/profile/ProfileForm.tsx` swaps its local-only save handler for `saveProfile` behind `useTransition`. The submit button disables and shows "Saving..." while in flight, the inline status message recolors to `text-success-darker` after a successful save, switches to `text-error` with the server message on failure, and surfaces `role="alert"` only on errors so screen readers pick them up.

---

## Notes

_Add notes here as the build progresses — workarounds, patterns, anything that differs from the context files._