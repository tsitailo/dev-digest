# DevDigest — local-first AI pull-request review (starter)

Import a PR → run an LLM agent review → grounded, structured findings. This is a
**starter template** grown milestone by milestone (M1–M8, see `README.md` → Roadmap).
Architecture and quick start: `README.md`. Test strategy: `TESTING.md`.

## Tech stack

All packages: **TypeScript 5.7** (strict), Node.js (ESM except `client`), **Vitest 2** for tests, **Zod 3**
for contracts.

| Package | Runtime / framework | Key libraries | Tests |
|---|---|---|---|
| `server/` | Node + **Fastify 5** (`fastify-type-provider-zod`), tsx | **Drizzle ORM 0.38** + `postgres` on **Postgres 16 + pgvector** (Docker), `openai` + `@anthropic-ai/sdk`, `octokit`, `simple-git`, `p-queue`, `@ast-grep/napi`, `dependency-cruiser`, `graphology`, `js-tiktoken`, `fastify-sse-v2` | Vitest + Testcontainers (`*.it.test.ts`) |
| `client/` | **Next.js 15** App Router, **React 19** | TanStack Query 5, `next-intl`, Tailwind CSS 4, `recharts`, `mermaid`, `react-markdown`, `lucide-react`, vendored design system `@devdigest/ui` | Vitest + React Testing Library + jsdom |
| `reviewer-core/` | pure TS library (no build step, consumed as source) | `openai` SDK (OpenAI + OpenRouter), Zod | Vitest |
| `e2e/` | tsx scripts | `agent-browser` (global CLI) driving the real stack | flow specs `specs/*.flow.json` |

## Layout — independent packages, NOT a workspace

| Folder | Package | Pkg manager | Notes |
|---|---|---|---|
| `server/` | `@devdigest/api` (Fastify, :3001) | **pnpm** | see `server/CLAUDE.md` |
| `client/` | `@devdigest/web` (Next.js 15, :3000) | **pnpm** | see `client/CLAUDE.md` |
| `reviewer-core/` | `@devdigest/reviewer-core` (review engine) | **npm** | see `reviewer-core/CLAUDE.md` |
| `e2e/` | `@devdigest/e2e` (agent-browser flows) | **npm** | see `e2e/CLAUDE.md` |

- Each package has its own `package.json` + lockfile. Run commands **inside the package dir**;
  there is no root `package.json`. Use the package's own manager.
- Cross-package code is shared via **tsconfig path aliases** to source, not published modules:
  - `server` → `@devdigest/reviewer-core` = `../reviewer-core/src` (raw TS, no build step).
  - `reviewer-core` → `@devdigest/shared` = `../server/src/vendor/shared`.
- Only Postgres (pgvector) runs in Docker; API and web run on the host.

Other top-level folders:

| Folder | Role |
|---|---|
| `scripts/` | `dev.sh` / `dev.ps1` (full dev stack bootstrap), `e2e.sh` (hermetic e2e) |
| `docs/` | `agent-prompts/` (reviewer agent prompts), `specs/` (feature specs, e.g. `run-cost-badge.md`) |
| `.claude/` | `skills/` (project skills), `hooks/` + `settings.json` (Stop hook for the insights loop) |
| `.github/workflows/` | CI, one workflow per package with path filters |
| `docker-compose.yml` | Postgres 16 + pgvector only |

## Commands

### Run

- Full dev stack from zero: `./scripts/dev.sh` (bash) or `scripts/dev.ps1` (Windows PowerShell).
  Flags: `--no-seed`, `--no-client`, `--db-only`.
- Per package: `cd server && pnpm dev` (API :3001), `cd client && pnpm dev` (web :3000).
- DB only: `docker compose up -d`, then `cd server && pnpm db:migrate && pnpm db:seed`.

### Verify (run inside the package dir)

| Package | Typecheck | Unit tests | Integration / e2e |
|---|---|---|---|
| `server/` | `pnpm typecheck` | `pnpm exec vitest run --exclude '**/*.it.test.ts'` | `pnpm exec vitest run .it.test` (Docker) |
| `client/` | `pnpm typecheck` | `pnpm test` | — |
| `reviewer-core/` | `npm run typecheck` | `npm test` | — |
| `e2e/` | `npm run typecheck` | — | `../scripts/e2e.sh` (hermetic) or `npm test` |

- **Lint: no linter is configured** (no `lint` script, no ESLint/Prettier config in any package).
  `typecheck` is the static gate — run it in every package you touched, and in server + client +
  reviewer-core after a contract change.

## Naming conventions

- **Files — server / reviewer-core / e2e**: kebab-case `.ts` (`run-executor.ts`, `price-book.ts`); repository
  layer `*.repo.ts`; a server module is fixed names `routes.ts` → `service.ts` → `repository.ts`;
  relative ESM imports end in `.js`.
- **Files — client**: route-private components in `_components/<PascalName>/<PascalName>.tsx` + `index.ts`
  (+ optional `styles.ts`, `constants.ts`, `<PascalName>.test.tsx`); shared app components in kebab-case
  folders under `src/components/` (`run-cost-badge/RunCostBadge.tsx`); data hooks in
  `src/lib/hooks/<feature>.ts`; strings in `messages/en/<feature>.json`.
- **Tests**: `*.test.ts(x)` next to the code (client) or in `server/test/`; DB-backed tests **must** be
  `*.it.test.ts`; e2e flows `e2e/specs/NN-name.flow.json`.
- **Code**: functions/variables camelCase; React components and types PascalCase; module constants
  UPPER_SNAKE (`GRID`, `SIZE_SMALL_MAX`). A Zod schema and its type share one PascalCase name
  (`export const RunSummary = z.object(...)` + `export type RunSummary = z.infer<typeof RunSummary>`).
- **Data**: DB tables/columns snake_case ↔ Drizzle fields camelCase (`costUsd: doublePrecision('cost_usd')`);
  JSON API fields and Zod contracts snake_case (`cost_usd`, `tokens_in`); i18n keys camelCase.
- **Migrations**: `NNNN_<generated_name>.sql` — names come from drizzle-kit, never chosen by hand.

## Do not touch

- **`server/src/db/migrations/**`** (SQL files and `meta/`): never create, edit, rename or delete by hand.
  Change `server/src/db/schema/*`, then `cd server && pnpm db:generate` and `pnpm db:migrate`. An applied
  migration is immutable — fix forward with a new one. Migrations are never applied on boot.
- **Lock files** — `server/pnpm-lock.yaml`, `client/pnpm-lock.yaml`, `reviewer-core/package-lock.json`,
  `e2e/package-lock.json`: never edit, delete or regenerate by hand, and never add a second lock file to a
  package (no pnpm lock in `reviewer-core/`/`e2e/`, no npm lock in `server/`/`client/`). They change only as
  a side effect of `pnpm add/remove` / `npm install <pkg>` / `npm uninstall` inside that package, when the
  task is a dependency change.
- **`*/src/vendor/**`** (`shared` contracts, `ui` design system): no refactors; only the contract-sync rule
  below.
- **`docker compose down -v`**: deletes the `devdigest_pgdata` volume with all imported repos and reviews —
  only if the user explicitly asks.
- **Secrets** (`~/.devdigest/secrets.json`, fallback env): never copy them into the DB, config objects,
  logs, or git.

## Cross-cutting rules

- **Shared Zod contracts are vendored twice**: `server/src/vendor/shared` and
  `client/src/vendor/shared`. They have already drifted (server copy is ahead: `openrouter`
  provider id, `sessionId`, `CommitFilesPayload`, …). When you change a contract, update
  **both** copies, then typecheck server, client and reviewer-core.
- Contracts drive everything: request validation + response serialization on the server,
  types in the client, `Review`/`Finding` types in the engine.
- New features for later milestones go in a new self-contained server module plus, usually, a new
  prompt slot in reviewer-core; the DB schema already has their tables (see `server/src/db/CLAUDE.md`).
- CI is one workflow per package with path filters (`.github/workflows/`). A change in
  `reviewer-core/**` also triggers `server-unit` (server typechecks against its source).

## Project skills (`.claude/skills/`)

fastify-best-practices, drizzle-orm-patterns, postgresql-table-design, zod, typescript-expert,
next-best-practices, react-best-practices, react-testing-library, security, mermaid-diagram,
engineering-insights.
Each package CLAUDE.md says which ones apply.

## Insights loop (`INSIGHTS.md`)

Each module keeps an append-only `INSIGHTS.md`: `client/`, `server/` (incl. repo-intel), `reviewer-core/`,
`e2e/`. Written by the `engineering-insights` skill; every entry has a date and a `path:line`.

- **Session context** — before work, read the `INSIGHTS.md` of every module you'll touch. Treat it as
  high-confidence guidance unless the user says otherwise.
- **Start-check** — your first reply on a task confirms which `INSIGHTS.md` files you read and
  summarizes the top 3 points relevant to the task (or states the file is empty).
- **During work** — when something non-obvious surfaces (root cause, misleading API, dead end,
  decision), capture it right away with the `engineering-insights` skill — without being asked.
- **End of task** — run the `engineering-insights` skill automatically; do not skip. A Stop hook
  (`.claude/hooks/insights-reminder.mjs`, wired in `.claude/settings.json`) blocks finishing a task that
  edited files until the skill has run. "Nothing worth recording: <reason>" is a valid outcome.
  Monthly: `/engineering-insights prune`.
