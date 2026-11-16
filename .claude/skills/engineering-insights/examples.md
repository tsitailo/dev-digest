# Engineering Insights — examples

The test for every entry: **would someone with no context from this session know what to do, and why,
after reading it?** And: **would it be obvious to anyone reading the code?** (then don't write it).

> The "useful" examples below are illustrative of *shape*. Several restate things already documented in
> this repo's CLAUDE.md files — in real use those would fail the **New** check and must not be written.

## Vague vs useful

### Pattern (What Works)

✗ `Reaping works well.`

✓ `- 2026-11-16 · Pattern · Reap orphaned 'running' agent_runs only after the server is listening and await it before accepting work — doing it async opens a race where a fresh run gets reaped. — evidence: server/src/app.ts:70-82`

Why better: says *when* and *why*, names the failure mode, points at the code.

### Mistake (What Doesn't Work)

✗ `Be careful with Zod contracts.`

✓ `- 2026-11-16 · Mistake · Editing only server/src/vendor/shared breaks the client silently at runtime (no shared typecheck): e.g. provider enum has 'openrouter' on the server but the client copy may not. Change both copies, then typecheck server, client, reviewer-core. — evidence: server/src/vendor/shared/adapters.ts:18`

(Already in root CLAUDE.md → in real use, **rejected as duplicate**.)

### Context (Codebase Patterns / Tool notes)

✗ `Migrations need to be run.`

✓ `- 2026-11-16 · Context · Migrations are never applied on boot; after a schema edit the API starts fine and only fails on the first query touching the new column (500, "column does not exist"). Run pnpm db:generate && pnpm db:migrate in server/. — evidence: server/src/app.ts (no migrate call), server/package.json scripts`

(Also already in CLAUDE.md → **rejected as duplicate**. The non-duplicate nuance — "boots fine, fails on first query" — could be appended on its own.)

### Decision

✗ `We chose p-queue.`

✓ `- 2026-11-16 · Decision · Jobs run in-process via p-queue mirrored to the jobs table instead of a broker. Why: single-user local-first app; a broker adds a second container for no throughput gain. Revisit if reviews must survive restart mid-run. — evidence: server/src/platform/jobs.ts`

### Recurring Errors & Fixes

✗ `Server crashes sometimes on start.`

✓ `- 2026-11-16 · Mistake · Symptom: API dies on boot with ERR_MODULE_NOT_FOUND from ../reviewer-core/src → Cause: server imports reviewer-core raw source, which needs its own node_modules → Fix: cd reviewer-core && npm ci. — evidence: server/CLAUDE.md "Requires reviewer-core/node_modules"`

### Open Question

✓ `- 2026-11-16 · Open Question · Does incremental re-index (pipeline/incremental.ts) pick up renames, or does it leave an orphan row for the old path? Saw duplicate symbols after a rename; not yet reproduced.`

## Rejected as banal (don't write these)

- "React components should be small." — generic advice, not about this codebase.
- "The server uses Fastify." — obvious from package.json.
- "Fixed the typo in ReviewCard." — a changelog line, not a learning.
- "Tests are important." — not actionable.
- "routes.ts calls service.ts." — visible from any route file and already in server/CLAUDE.md.
- "Branch fix-migration currently has a failing test." — not durable.
