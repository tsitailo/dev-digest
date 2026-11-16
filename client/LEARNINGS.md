# LEARNINGS — client

> Non-obvious, evidence-backed lessons for working in this module. Read before work; treat as
> high-confidence guidance unless told otherwise. **Append-only** — written by `/engineering-insights`,
> pruned monthly via `/engineering-insights prune`. A draft under review: spot-check before trusting.
>
> Entry format: `- YYYY-MM-DD · Pattern|Mistake|Context|Decision · <actionable essence> — evidence: path:line`

## What Works

## What Doesn't Work

## Codebase Patterns

- 2026-11-16 · Context · The showcase `Gallery` is mounted in the smoke test WITHOUT a `NextIntlClientProvider`, so an app component that calls `useTranslations` crashes it. Wrap such components in their own provider inside the showcase. — evidence: client/src/test/smoke.test.tsx:18, client/src/components/showcase/Showcase.tsx:134

## Tool / Library Notes

## Decisions

## Recurring Errors & Fixes

## Session Notes

- 2026-11-16 — Run Cost Badge (RunCostBadge in list, verdict banner, timeline, trace); added: Context (showcase intl).

## Open Questions
