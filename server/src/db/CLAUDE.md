# server/src/db — Drizzle schema, migrations, seed

## Commands (run in `server/`)

- `pnpm db:generate` — drizzle-kit diffs `src/db/schema.ts` → new SQL in `migrations/` (+ `meta/` snapshot).
- `pnpm db:migrate` — applies migrations (`src/db/migrate.ts`). **Never automatic on boot.**
- `pnpm db:seed` — idempotent demo data (`src/db/seed.ts`).

## Rules

- `schema.ts` is a barrel; tables live in `schema/<domain>.ts`. Add a new table to the right
  domain file (or a new one re-exported from `schema.ts`).
- **The schema already contains every table for all milestones** (skills, eval, ci, knowledge,
  context, …). Most are empty in the starter. Check before creating a table — it may already exist.
- Extend via **new migrations only**; never edit an applied migration or a `meta/*_snapshot.json` by hand.
  Generated file names are random (`0002_warm_moonstone.sql`) — that's normal.
- Tenancy: every domain table has `workspace_id` (FK → workspaces) and, where relevant, `created_by`.
  All queries scope by `workspace_id`.
- pgvector is enabled by migration `0000_init.sql`; `vector` type errors mean migrations ran against
  the wrong DB.
- `rows.ts` holds row-type helpers; `seed-prompts.ts` holds built-in agent system prompts
  (canonical prose versions: `docs/agent-prompts/`).

## Seed

Default workspace + system user `you@local`, settings, demo repo `acme/payments-api`, PR #482 with
files/commits, a sample review with findings, and **three** built-in agents (General, Security,
Performance) on `openrouter` / `deepseek-v4-flash`. e2e flows depend on this data — keep seed changes
compatible with `e2e/specs/*` (PR #482, agent names).

## After a schema change

1. `pnpm db:generate` and review the SQL.
2. `pnpm db:migrate` locally.
3. Run integration tests: `pnpm exec vitest run .it.test` (they migrate + seed a fresh container).

Skills: drizzle-orm-patterns, postgresql-table-design.
