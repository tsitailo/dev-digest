# INSIGHTS — client

> Non-obvious, evidence-backed lessons for working in this module. Read before work; treat as
> high-confidence guidance unless told otherwise. **Append-only**: written by the `engineering-insights`
> skill (runs automatically at the end of every task that edited files), pruned monthly via
> `/engineering-insights prune`. A draft under review: spot-check before trusting.
>
> Every entry (Session Notes and Open Questions included) has a date AND a `path:line`:
> `- YYYY-MM-DD · Pattern|Mistake|Context|Decision|Session|Question · <actionable essence> — evidence: path/file.ts:LINE`

## What Works

## What Doesn't Work

## Codebase Patterns

- 2026-11-16 · Context · The showcase `Gallery` is mounted in the smoke test WITHOUT a `NextIntlClientProvider`, so an app component that calls `useTranslations` crashes it. Wrap such components in their own provider inside the showcase. — evidence: client/src/test/smoke.test.tsx:18, client/src/components/showcase/Showcase.tsx:134

## Tool / Library Notes

## Decisions

## Recurring Errors & Fixes

## Session Notes

- 2026-11-16 · Session · Run Cost Badge (RunCostBadge in list, verdict banner, timeline, trace); added: Context (showcase intl). — evidence: client/src/components/run-cost-badge/RunCostBadge.tsx:26

## Open Questions
