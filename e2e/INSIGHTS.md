# INSIGHTS — e2e

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

## Tool / Library Notes

## Decisions

## Recurring Errors & Fixes

## Session Notes

- 2026-11-17 · Session · Added flow 08 (severity counters hover popup + filter on PR #482); added: Question (hover action unverified). — evidence: e2e/specs/08-pr-severity-filter.flow.json:1

## Open Questions

- 2026-11-17 · Question · Flow 08 is the first to use `find role button hover --name …`; it was written without `agent-browser` installed locally, so neither the `hover` action nor exact-name matching of `1 CRITICAL` has been run yet. Verify on the first hermetic run. — evidence: e2e/specs/08-pr-severity-filter.flow.json:13
