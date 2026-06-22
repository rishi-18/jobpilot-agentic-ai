# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

### Homepage Landing Page

- File: `app/page.tsx`
- Key structure: `mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-8 pb-8`, `border-x border-border bg-surface` section wrappers, `grid gap-0 overflow-hidden border border-border bg-surface` content blocks
- Hero: `relative overflow-hidden border border-border bg-surface px-6 pb-12 pt-12 text-center`, `text-[58px] font-semibold leading-[0.96] tracking-[-0.06em]`, `bg-overlay` primary CTA, `border border-border bg-surface` secondary CTA
- Preview frame: `rounded-t-3xl border border-border bg-surface pt-6`, `rounded-[28px] border border-border bg-surface p-6`
- Feature table: `overflow-hidden rounded-2xl border border-border bg-surface p-3`, `grid grid-cols-[1.6fr_0.9fr_0.9fr_0.8fr]`
- Terminal card: `overflow-hidden rounded-[18px] border border-border bg-overlay`, `font-mono text-[14px] leading-8`
- Testimonial and CTA: `border border-border bg-surface py-14 text-center`, `relative overflow-hidden border border-border bg-surface px-6 py-14 text-center`

### Login Page

- File: `app/(auth)/login/page.tsx`
- Last updated: 2026-06-20

| Property         | Class |
| ---------------- | ----- |
| Background       | `min-h-screen bg-background` |
| Border           | `border border-border` |
| Border radius    | `rounded-2xl`, `rounded-xl`, `rounded-md` |
| Text — primary   | `text-text-primary`, `text-text-darkest` |
| Text — secondary | `text-text-secondary`, `text-text-muted` |
| Spacing          | `px-6 py-8`, `p-8`, `mt-8 space-y-3`, `px-4 py-3` |
| Hover state      | `hover:bg-surface-secondary`, `hover:bg-overlay/90`, `hover:text-accent` |
| Shadow           | `shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]`, `shadow-[0_8px_24px_rgba(124,92,252,0.24)]`, `shadow-sm` |
| Accent usage     | `bg-accent text-accent-foreground`, `bg-overlay text-surface` |

**Pattern notes:**
The auth page uses a single centered card with the same border/shadow language as the rest of the app, but with a narrower max width and stronger vertical spacing than the homepage. The Google button is the neutral secondary action, while GitHub uses the dark primary-style CTA treatment. Future auth screens should keep the same card radius, border token, and text hierarchy so they feel like part of the same system.

### Dashboard Page

- File: `app/dashboard/page.tsx`
- Last updated: 2026-06-22

| Property         | Class |
| ---------------- | ----- |
| Background       | `min-h-screen bg-background` |
| Border           | `border border-border` |
| Border radius    | `rounded-2xl`, `rounded-lg`, `rounded-md` |
| Text — primary   | `text-text-primary`, `text-text-darkest` |
| Text — secondary | `text-text-secondary`, `text-text-muted` |
| Spacing          | `px-8 py-8`, `p-6`, `mt-6 grid gap-6`, `px-6 py-6` |
| Hover state      | `hover:bg-surface-secondary` |
| Shadow           | `shadow-sm`, `shadow-[0_8px_24px_rgba(124,92,252,0.24)]` |
| Accent usage     | `bg-accent`, `text-accent`, `bg-info-medium`, `bg-success`, `bg-success-lightest` |

**Pattern notes:**
The dashboard uses a sectioned card layout with high-level stats, then two-column analytical blocks and dynamic chart components. All cards stay white with border/shadow treatment. Wires real-time `agent_runs` and `jobs` queries for the chronological activity feed (rendered as timeline with success/info color coding) and calculates metrics for company research, jobs found, and match scores.


### Find Jobs Page

- File: `app/find-jobs/page.tsx`
- Last updated: 2026-06-20

| Property         | Class |
| ---------------- | ----- |
| Background       | `min-h-screen bg-background` |
| Border           | `border border-border` |
| Border radius    | `rounded-2xl`, `rounded-md`, `rounded-full` |
| Text — primary   | `text-text-primary` |
| Text — secondary | `text-text-secondary`, `text-text-muted` |
| Spacing          | `px-8 py-8`, `p-6`, `mt-6`, `px-6 py-4` |
| Hover state      | `hover:bg-surface-secondary` |
| Shadow           | `shadow-sm` |
| Accent usage     | `bg-accent`, `text-accent-foreground`, `bg-success-lightest`, `bg-info-medium`, `bg-warning` |

**Pattern notes:**
The jobs page keeps the search controls, filter bar, table, and pagination in separate bordered cards so the page stays scannable. The row and badge styling should stay simple and token-driven; score bars, source pills, and success banners carry the visual weight.

### Find Jobs Search Controls

- File: `app/find-jobs/search-controls.tsx`
- Last updated: 2026-06-20

| Property         | Class |
| ---------------- | ----- |
| Border           | `border border-border` |
| Border radius    | `rounded-md` |
| Text — primary   | `text-text-primary` |
| Text — secondary | `text-text-secondary`, `text-text-muted` |
| Spacing          | `space-y-2`, `px-4 py-3`, `gap-4` |
| Hover state      | `hover:bg-accent-dark` |
| Shadow           | `shadow-sm` |
| Accent usage     | `bg-accent text-accent-foreground`, `focus:ring-accent` |

**Pattern notes:**
The search controls stay as a simple three-column input row with a primary action button. Keep the controls visually identical to the rest of the jobs page and attach analytics or other side effects at the button layer, not by turning the whole page into a client component.

### Profile Page

- File: `app/profile/page.tsx`
- Last updated: 2026-06-20

| Property         | Class |
| ---------------- | ----- |
| Background       | `min-h-screen bg-background` |
| Border           | `border border-border`, `border-dashed border-border` |
| Border radius    | `rounded-2xl`, `rounded-md`, `rounded-full` |
| Text — primary   | `text-text-primary`, `text-text-darkest` |
| Text — secondary | `text-text-secondary`, `text-text-muted` |
| Spacing          | `px-8 py-8`, `p-6`, `mt-6 grid gap-6`, `space-y-8` |
| Hover state      | `hover:bg-surface-secondary` |
| Shadow           | `shadow-sm` |
| Accent usage     | `bg-accent-muted`, `bg-accent`, `text-accent-foreground`, `bg-surface-secondary` |

**Pattern notes:**
The profile page is the densest form surface so it uses a prominent attention banner, a dashed upload area, and a large multi-section form card. Future profile screens should keep the same hierarchy: attention state first, upload area second, then the editable form in one dominant white card. The page itself is a server component that only handles the navbar/session; all form state lives in `ProfileForm`.

### Profile Form

- File: `components/profile/ProfileForm.tsx`
- Last updated: 2026-06-20

| Property         | Class |
| ---------------- | ----- |
| Client component | `"use client"`, owns full profile state via `useState<Profile>` |
| Section headings | `text-[16px] font-semibold text-text-primary` |
| Field labels     | `text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary` |
| Inputs           | `w-full rounded-md border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent` |
| Disabled input   | swap `bg-surface` for `bg-surface-secondary text-text-muted` and add `disabled cursor-not-allowed` |
| Section gaps     | `space-y-8` between major sections, `mt-4 grid gap-4 md:grid-cols-2` inside |
| Save bar         | `flex items-center justify-between border-t border-border pt-6` |
| Save CTA         | `rounded-md bg-accent px-5 py-3 text-sm font-medium text-accent-foreground shadow-sm hover:bg-accent-dark` |
| Local-only state | save click records a timestamp and shows a `text-text-muted` note — feature 06 swaps this for the server action |

**Pattern notes:**
Every field is a controlled input with `onChange` calling a single `patch(key, value)` helper. Education fields use a separate `patchEducation` helper because they live one level deeper in the form shape. All write paths in this pass stay local — feature 06 owns the action.

### Profile Attention Banner

- File: `components/profile/AttentionBanner.tsx`
- Last updated: 2026-06-20

| Property         | Class |
| ---------------- | ----- |
| Container        | `rounded-2xl border border-border bg-accent-muted px-6 py-5` |
| Layout           | `flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between` |
| Ring             | `size-32` wrapper around two stacked `svg` circles, second uses `stroke-success` / `stroke-info-medium` / `stroke-warning` |
| Centre number    | `text-[20px] font-semibold leading-none` + `text-[10px] font-medium uppercase tracking-[0.12em] text-text-muted` sublabel |
| Eyebrow          | `text-[12px] font-semibold uppercase tracking-[0.18em] text-accent` |
| Body copy        | `text-sm leading-6 text-text-secondary` |
| Missing tag      | `rounded-full bg-surface px-3 py-1 text-[12px] font-medium text-text-secondary` |
| All-set tag      | same pill, swap to `text-success-darker` |

**Pattern notes:**
The ring tone and the eyebrow copy both come from the same `percentage` value so the user only sees one number moving. The same `requiredFields` list in `lib/profile-completeness.ts` feeds both the ring percentage and the missing tags, so what the user sees here always matches what the server will treat as required in 06.

### Profile Tag Input

- File: `components/profile/TagInput.tsx`
- Last updated: 2026-06-20

| Property         | Class |
| ---------------- | ----- |
| Wrapper          | `flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 focus-within:border-accent focus-within:ring-1 focus:ring-accent` |
| Tag chip         | `inline-flex items-center gap-1 rounded-full bg-accent-muted px-3 py-1 text-[12px] font-medium text-accent` |
| Tag remove       | `grid size-4 place-items-center rounded-full text-accent hover:bg-accent hover:text-accent-foreground` |
| Inline input     | `min-w-[8ch] flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none` |
| Helper text      | `text-[12px] text-text-muted` |

**Pattern notes:**
Used for Skills, Industries, Job Titles Seeking, and Preferred Locations. Enter or comma commits the draft; Backspace with an empty draft pops the last tag. Duplicates are dropped silently so the user cannot end up with the same tag twice. No icons — the × is an inline SVG stroke so the package stays free of an icon library.

### Profile Work Experience List

- File: `components/profile/WorkExperienceList.tsx`
- Last updated: 2026-06-20

| Property         | Class |
| ---------------- | ----- |
| Role card        | `rounded-2xl border border-border bg-surface-secondary p-4` |
| Field grid       | `grid gap-3 md:grid-cols-2` |
| Checkbox         | `size-4 rounded border-border text-accent focus:ring-accent` |
| End date input   | same as base input plus `disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-muted` |
| Action row       | `mt-3 flex justify-end` |
| Remove role      | `rounded-md border border-border bg-surface px-3 py-2 text-[12px] font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary` |
| Add role         | `rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary hover:bg-surface-secondary` |
| Empty state      | `rounded-2xl border border-dashed border-border bg-surface-secondary px-4 py-6 text-center text-sm text-text-muted` |
| Max reached      | `rounded-md border border-dashed border-border bg-surface-secondary px-4 py-3 text-center text-[12px] text-text-muted` |

**Pattern notes:**
Capped at 3 roles per the build plan. Toggling "Currently working here" both disables the end-date input and clears any existing end date so the saved value is never stale. When the cap is hit, the Add Role button is replaced by a muted helper explaining the limit — feature 06 may revisit this when the server action can persist more.

### Profile Resume Section

- File: `components/profile/ResumeSection.tsx`
- Last updated: 2026-06-22

| Property         | Class |
| ---------------- | ----- |
| Dropzone idle    | `flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-secondary px-6 py-10 text-center` |
| Dropzone active  | same plus `border-accent bg-accent-muted` |
| Dropzone icon    | `grid size-12 place-items-center rounded-full bg-accent-muted text-accent` |
| File row         | `flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3` |
| File icon tile   | `grid size-10 place-items-center rounded-md bg-accent-muted text-accent` |
| Action row       | `flex flex-wrap items-center gap-3` |
| Secondary button | `rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary` |
| Primary button   | `rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-dark` |
| Error text       | `text-[12px] text-error` |

**Pattern notes:**
The dropzone is a `<label>` wrapping a visually-hidden `<input type="file">` so it stays keyboard-accessible. The PDF-only and 10 MB cap rules live next to the file picker. "Select Resume" becomes "Replace Resume" once a file is in state. Wires the "Extract from Resume" button (which shows only when a resume file exists) to trigger the AI parser agent at `/api/resume/extract`. The extraction process works with both a newly picked file or the stored database resume. During extraction, inputs are disabled, the button reads "Extracting...", and a progress message appears in the form footer. The "Generate Resume from Profile" button is wired to `/api/resume/generate` via the `onGenerate` callback, which first auto-saves the profile form data and then compiles and uploads the PDF. The button shows "Generating..." during progress.

### Navbar Log Out Button

- File: `app/navbar-account-button.tsx`
- Last updated: 2026-06-21

| Property         | Class |
| ---------------- | ----- |
| Background       | `bg-surface` |
| Border           | `border border-border` |
| Border radius    | `rounded-md` |
| Text — primary   | `text-text-primary` |
| Text — secondary | `text-text-secondary` |
| Spacing          | `gap-2`, `px-4 py-2` |
| Hover state      | `hover:bg-surface-secondary hover:text-text-primary` |
| Avatar pill      | `bg-accent-muted text-accent`, `size-6 rounded-full`, `text-[11px] font-semibold uppercase` |
| Label text       | `Log out` (replaces the previous name/email label) |
| Tooltip          | `title={label}` so the avatar letter stays discoverable |

**Pattern notes:**
The visible button text is `Log out`. A leading avatar pill still shows the first letter of the user`s name or email so the slot keeps its weight, and a `title` tooltip surfaces the full label on hover. Clicking the button calls `window.confirm("Log out of JobPilot?")`; cancelling calls `event.preventDefault()` so the server action is never posted. The actual sign-out, cookie clear, and `redirect("/")` still happen in `actions/auth.ts` on the server — the only client-side change is the confirmation guard.

### User Session Sync

- File: `app/user-session-sync.tsx`
- Last updated: 2026-06-20

| Property         | Class |
| ---------------- | ----- |
| Client component | `"use client"`, uses `usePostHog()` |
| Reads            | `posthog.__loaded`, `user.id`, `user.email`, `user.name` |
| Writes           | `posthog.identify(userId, traits)` or `posthog.reset()` |

**Pattern notes:**
A null-rendering client component that mirrors the server-resolved InsForge user into PostHog. Required because `person_profiles: "identified_only"` skips all events without an identity, and a plain server-side capture cannot attach the JS SDK identity. Render it inside `<main>` next to the navbar so it is present on every authenticated page and resets cleanly after sign-out.

### Job Details Page

- File: `app/find-jobs/[id]/page.tsx`
- Last updated: 2026-06-22

| Property         | Class |
| ---------------- | ----- |
| Background       | `min-h-screen bg-background` |
| Border           | `border border-border` |
| Border radius    | `rounded-2xl`, `rounded-xl`, `rounded-full` |
| Text — primary   | `text-text-primary`, `text-text-darkest` |
| Text — secondary | `text-text-secondary`, `text-text-muted` |
| Spacing          | `px-8 pb-16`, `mt-8`, `mt-6`, `p-6`, `p-4` |
| Accent usage     | `bg-accent text-accent-foreground`, `bg-success-lightest text-success-foreground`, `bg-info-lightest text-info-foreground` |

**Pattern notes:**
Contains the comprehensive layout displaying job details, metrics cards, match scoring reason, and a visual list of matched skills vs profile gap skills. Preserves whitespace in description styling using `whitespace-pre-line`.

### Company Research Dossier Card

- File: `app/find-jobs/[id]/page.tsx` (dossier blocks)
- Last updated: 2026-06-22

| Property         | Class |
| ---------------- | ----- |
| Border           | `border border-border`, `border-dashed border-border` |
| Border radius    | `rounded-2xl`, `rounded-xl` |
| Spacing          | `p-6`, `py-12`, `space-y-6`, `space-y-2` |
| Accent usage     | `text-accent`, `bg-surface-secondary` |
| Button           | Client components with disabled loading state and styling matching default CTAs |

**Pattern notes:**
Renders the full 9-field company intelligence dossier when available or displays a custom "No research yet" empty state card with a call-to-action button that triggers background crawler and LLM research.