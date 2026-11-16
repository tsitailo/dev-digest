# Engineering Insights — examples

The test for every entry: **would someone with no context from this task know what to do, and why,
after reading it?** And: **would it be obvious to anyone reading the code?** (then don't write it).
Every entry — including Session Notes and Open Questions — has a **date** and a **`path:line`**.

> The "useful" examples below show the *shape*. Several restate things already documented in this
> repo's CLAUDE.md files — in real use those fail the **New** check and must not be written.

## Vague vs useful

### Pattern (What Works)

✗ `Reaping works well.`

✓ `- 2026-11-16 · Pattern · Reap orphaned 'running' agent_runs only after the server is listening and await it before accepting work — doing it async opens a race where a fresh run gets reaped. — evidence: server/src/app.ts:81`

Why better: says *when* and *why*, names the failure mode, points at the exact line.

### Mistake (What Doesn't Work)

✗ `Be careful with Zod contracts.`

✓ `- 2026-11-16 · Mistake · Editing only server/src/vendor/shared breaks the client silently at runtime (no shared typecheck): e.g. the provider enum has 'openrouter' on the server but the client copy may not. Change both copies, then typecheck server, client, reviewer-core. — evidence: server/src/vendor/shared/adapters.ts:18`

(Already in root CLAUDE.md → in real use, **rejected as duplicate**.)

### Context (Codebase Patterns / Tool notes)

✗ `Migrations need to be run.`

✓ `- 2026-11-16 · Context · Migrations are never applied on boot; after a schema edit the API starts fine and only fails on the first query touching the new column (500, "column does not exist"). Run pnpm db:generate && pnpm db:migrate in server/. — evidence: server/src/db/migrate.ts:30`

(Also already in CLAUDE.md → **rejected as duplicate**. The non-duplicate nuance — "boots fine, fails on first query" — could be appended on its own.)

### Decision

✗ `We chose p-queue.`

✓ `- 2026-11-16 · Decision · Jobs run in-process via p-queue mirrored to the jobs table instead of a broker. Why: single-user local-first app; a broker adds a second container for no throughput gain. Revisit if reviews must survive restart mid-run. — evidence: server/src/platform/jobs.ts:31`

### Recurring Errors & Fixes

✗ `Server crashes sometimes on start.`

✓ `- 2026-11-16 · Mistake · Symptom: API dies on boot with ERR_MODULE_NOT_FOUND from ../reviewer-core/src → Cause: server imports reviewer-core raw source via a path alias, which needs reviewer-core's own node_modules → Fix: cd reviewer-core && npm ci. — evidence: server/tsconfig.json:24`

### Session Note

✗ `- worked on cost badge` (no date, no evidence)

✓ `- 2026-11-16 · Session · Run Cost Badge (server side); added: Context (ReviewDto), Decision (cost storage). — evidence: server/src/modules/reviews/run-executor.ts:213`

### Open Question

✗ `Renames might be broken?` (no date, no line)

✓ `- 2026-11-16 · Question · Does incremental re-index pick up renames, or does it leave an orphan row for the old path? Saw duplicate symbols after a rename; not yet reproduced. — evidence: server/src/modules/repo-intel/pipeline/incremental.ts:52`

## Rejected (don't write these)

- "React components should be small." — generic advice, not about this codebase.
- "The server uses Fastify." — obvious from package.json.
- "Fixed the typo in ReviewCard." — a changelog line, not an insight.
- "Tests are important." — not actionable.
- "routes.ts calls service.ts." — visible from any route file and already in server/CLAUDE.md.
- "Branch fix-migration currently has a failing test." — not durable.
- "`pnpm db:migrate` prints notices — evidence: `pnpm db:migrate`" — a bare command is not evidence;
  cite the line that produces the output (`server/src/db/migrate.ts:45`).
