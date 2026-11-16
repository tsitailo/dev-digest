# LEARNINGS — server

> Non-obvious, evidence-backed lessons for working in this module. Read before work; treat as
> high-confidence guidance unless told otherwise. **Append-only** — written by `/engineering-insights`,
> pruned monthly via `/engineering-insights prune`. A draft under review: spot-check before trusting.
>
> Entry format: `- YYYY-MM-DD · Pattern|Mistake|Context|Decision · <actionable essence> — evidence: path:line`

## What Works

## What Doesn't Work

## Codebase Patterns

- 2026-11-16 · Context · Review responses are typed by the hand-written `ReviewDto` interface, not the Zod `ReviewRecord`, and review/pull routes have no response schema. Adding a field to the shared contract alone does NOT make the API emit it: also extend `ReviewDto` + `reviewToDto`. — evidence: server/src/modules/reviews/helpers.ts:18

## Tool / Library Notes

- 2026-11-16 · Context · `pnpm db:migrate` dumps Postgres NOTICE objects (`extension "vector" already exists, skipping`, …) that look like errors; the run succeeded if the last line is `✓ migrations applied`. Verify a column with `docker exec devdigest-postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\d agent_runs"'`. — evidence: `pnpm db:migrate` output

## Decisions

- 2026-11-16 · Decision · Run cost is stored per run in `agent_runs.cost_usd`, copied as-is from the engine (`outcome.costUsd`); null = unknown, never backfilled. PR list COST = latest `done` run, same as the score ring. Why: prices change, so tokens × today's price for old runs would be fiction. Spec: docs/specs/run-cost-badge.md — evidence: server/src/modules/reviews/run-executor.ts:213, server/src/modules/pulls/routes.ts:135

## Recurring Errors & Fixes

## Session Notes

- 2026-11-16 — Run Cost Badge (server side); added: Context (ReviewDto), Context (db:migrate notices), Decision (cost storage).

## Open Questions
