# INSIGHTS — server

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

- 2026-11-16 · Context · Review responses are typed by the hand-written `ReviewDto` interface, not the Zod `ReviewRecord`, and review/pull routes have no response schema. Adding a field to the shared contract alone does NOT make the API emit it: also extend `ReviewDto` + `reviewToDto`. — evidence: server/src/modules/reviews/helpers.ts:18

## Tool / Library Notes

- 2026-11-16 · Context · `pnpm db:migrate` dumps Postgres NOTICE objects (`extension "vector" already exists, skipping`, …) that look like errors; the run succeeded only if it ends with `✓ migrations applied`. — evidence: server/src/db/migrate.ts:45

## Decisions

- 2026-11-16 · Decision · Run cost is stored per run in `agent_runs.cost_usd`, copied as-is from the engine (`outcome.costUsd`); null = unknown, never backfilled. PR list COST = latest `done` run, same as the score ring. Why: prices change, so tokens × today's price for old runs would be fiction. Spec: docs/specs/run-cost-badge.md — evidence: server/src/modules/reviews/run-executor.ts:213, server/src/modules/pulls/routes.ts:135

## Recurring Errors & Fixes

- 2026-11-16 · Mistake · [repo-intel] Symptom: 6 tests in `indexer-pipeline.test.ts` (runFullIndex + runIncremental) fail on Windows with `ENOENT … %TEMP%/repo-intel-inc-*/src/a.ts` → Cause: not investigated; fails on a clean checkout too, so it is NOT caused by unrelated changes → Fix: none yet; confirm with `git stash` + rerun before debugging your own change. — evidence: server/test/indexer-pipeline.test.ts:267

## Session Notes

- 2026-11-16 · Session · Run Cost Badge (server side); added: Context (ReviewDto), Context (db:migrate notices), Decision (cost storage), Mistake ([repo-intel] Windows tests). — evidence: server/src/modules/reviews/run-executor.ts:213

## Open Questions

- 2026-11-16 · Question · [repo-intel] Why does the tmpdir clone in `indexer-pipeline.test.ts` miss `src/a.ts` on Windows? Suspects: path separators or git checkout inside the temp repo. — evidence: server/test/indexer-pipeline.test.ts:267
