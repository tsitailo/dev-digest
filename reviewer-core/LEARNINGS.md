# LEARNINGS — reviewer-core

> Non-obvious, evidence-backed lessons for working in this module. Read before work; treat as
> high-confidence guidance unless told otherwise. **Append-only** — written by `/engineering-insights`,
> pruned monthly via `/engineering-insights prune`. A draft under review: spot-check before trusting.
>
> Entry format: `- YYYY-MM-DD · Pattern|Mistake|Context|Decision · <actionable essence> — evidence: path:line`

## What Works

## What Doesn't Work

## Codebase Patterns

- 2026-11-16 · Context · A run's `costUsd` becomes null if ANY chunk call has no price (OpenRouter `usage.cost` missing and the price book doesn't know the model). Consumers must treat null as "unknown", never as 0. — evidence: reviewer-core/src/review/run.ts:184, reviewer-core/src/llm/openrouter.ts:107

## Tool / Library Notes

## Decisions

## Recurring Errors & Fixes

## Session Notes

- 2026-11-16 — Run Cost Badge (read-only here); added: Context (cost null propagation).

## Open Questions
