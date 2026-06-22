# Memory — Dashboard & Stats Real Data Wiring

Last updated: 2026-06-22

## What was built

- **Feature 14 (Dashboard Page)**: Created high-fidelity 3D interactive dashboard utilizing Recharts with custom SVG cylinder renderers and neon gradient area charts.
- **Feature 15 (Stats Bar — Real Data)**: Wired the four metrics cards to fetch real jobs counts, average match scores, companies researched, and rolling 7-day discovery stats.

## Decisions made

- Calculated rolling weekly discoveries using JavaScript date comparisons over a single SQL select query containing only the necessary columns (`match_score`, `company_research`, `found_at`), keeping DB traffic low.
- Hid metric delta comparison pills since dynamic previous-week delta calculations are not yet requested.

## Problems solved

- Fixed database column query exception caused by `created_at` column reference mismatch against `jobs` schema by querying `found_at` exclusively.
- Silenced Recharts `The width(-1) and height(-1) of chart should be greater than 0` initial sizing console warnings in client components by guarding ResponsiveContainer renders with client-side `isMounted` state.

## Current state

- The Dashboard and Stats wiring is 100% complete and working cleanly.
- Compile check is completely green.

## Next session starts with

- **Feature 16 (Recent Activity — Real Data)**: Query the `agent_runs` table (most recent runs) and `jobs` table (most recent company researches) for the active user, merging and sorting them chronologically to show live timeline feed.

## Open questions

- None.