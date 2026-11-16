# LEARNINGS — repo-intel

> Non-obvious, evidence-backed lessons for working in this module. Read before work; treat as
> high-confidence guidance unless told otherwise. **Append-only** — written by `/engineering-insights`,
> pruned monthly via `/engineering-insights prune`. A draft under review: spot-check before trusting.
>
> Entry format: `- YYYY-MM-DD · Pattern|Mistake|Context|Decision · <actionable essence> — evidence: path:line`

## What Works

## What Doesn't Work

## Codebase Patterns

## Tool / Library Notes

## Decisions

## Recurring Errors & Fixes

- 2026-11-16 · Mistake · Symptom: 6 tests in `server/test/indexer-pipeline.test.ts` fail on Windows with `ENOENT … %TEMP%/repo-intel-inc-*/src/a.ts` → Cause: not investigated; fails on a clean checkout too, so it is NOT caused by unrelated changes → Fix: none yet; confirm with `git stash` + rerun before debugging your own change. — evidence: `pnpm exec vitest run test/indexer-pipeline.test.ts` (6 failed / 5 passed)

## Session Notes

- 2026-11-16 — no repo-intel changes; recorded a pre-existing Windows test failure seen while running the server suite.

## Open Questions

- 2026-11-16 · Why does `indexer-pipeline.test.ts` fail on Windows (tmpdir clone missing `src/a.ts`)? Path separators or git checkout in the tmp repo are suspects.
