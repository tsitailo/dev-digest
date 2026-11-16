# modules/repo-intel — the codebase indexer

**Before work here, read `server/INSIGHTS.md`** (entries tagged `[repo-intel]`; see root `CLAUDE.md` → Insights loop).

Pipeline diagram, facade list and routes: `README.md` in this folder.

## Mental model

Index **once on clone** (`pipeline/full.ts`), then **incrementally on fetch** keyed by file content hash
(`pipeline/incremental.ts`). Reviews only **read** the precomputed index — no analysis at request time.

Pipeline: `walk.ts` (discover files) → ast-grep adapter (symbols + references) → dependency-cruiser
(import graph) → `rank.ts` (PageRank + git hotness) → `repo-map.ts` (token-budgeted skeleton, cached).
Tables: `symbols`, `references`, `file_edges`, `file_rank`, `repo_map_cache` (`db/schema/repo-intel.ts`).

## Rules

- **Everything outside this folder goes through the facade** (`RepoIntel` interface in `types.ts`,
  implemented by `service.ts`, exposed as `container.repoIntel`). Never import `pipeline/*` or query its
  tables from other modules.
- Facade methods **degrade gracefully**: unindexed/partial repo → empty result, not an exception.
- Adapters (`container.depgraph`, `container.tokenizer`, ast-grep) are injected — keep pipeline code
  testable with mocks.
- Starter wires only `getRepoMap`, `getFileRank`, `getCallerSignatures` (used by `reviews/run-executor.ts`).
  `getBlastRadius`, `getUnresolvedReferences`, `getConventionSamples` are for later milestones — build on
  them instead of re-indexing.
- Tunables (limits, budgets) live in `constants.ts`.
- `@ast-grep/napi` relies on prebuilt native binaries (CI typechecks on Windows to catch a missing win32 build).

## Routes

`GET /repos/:id/index-state` (drives the **Indexed** badge), `POST /repos/:id/resync` (enqueue re-index).

## Tests

`test/indexer-*.test.ts`, `test/repo-intel-*.test.ts`, `test/astgrep.test.ts`, `test/extract.test.ts`;
`repo-intel-symbol-clamp.it.test.ts` needs Docker.
