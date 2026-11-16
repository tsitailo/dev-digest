# DevDigest — local-first AI pull-request review (starter)

Import a PR → run an LLM agent review → grounded, structured findings. This is a
**starter template** grown milestone by milestone (M1–M8, see `README.md` → Roadmap).
Architecture and quick start: `README.md`. Test strategy: `TESTING.md`.

## Layout — independent packages, NOT a workspace

| Folder | Package | Pkg manager | Notes |
|---|---|---|---|
| `server/` | `@devdigest/api` (Fastify, :3001) | **pnpm** | see `server/CLAUDE.md` |
| `client/` | `@devdigest/web` (Next.js 15, :3000) | **pnpm** | see `client/CLAUDE.md` |
| `reviewer-core/` | `@devdigest/reviewer-core` (review engine) | **npm** | see `reviewer-core/CLAUDE.md` |
| `e2e/` | `@devdigest/e2e` (agent-browser flows) | **npm** | see `e2e/CLAUDE.md` |

- Each package has its own `package.json` + lockfile. Run commands **inside the package dir**;
  there is no root `package.json`. Use the package's own manager (don't add a pnpm lockfile to
  `reviewer-core/` or `e2e/`, or an npm lockfile to `server/`/`client/`).
- Cross-package code is shared via **tsconfig path aliases** to source, not published modules:
  - `server` → `@devdigest/reviewer-core` = `../reviewer-core/src` (raw TS, no build step).
  - `reviewer-core` → `@devdigest/shared` = `../server/src/vendor/shared`.
- Only Postgres (pgvector) runs in Docker; API and web run on the host.

## Commands

- Full dev stack from zero: `./scripts/dev.sh` (bash) or `scripts/dev.ps1` (Windows PowerShell).
  Flags: `--no-seed`, `--no-client`, `--db-only`.
- Hermetic browser e2e (isolated ports 5433/3101/3100): `./scripts/e2e.sh`.
- Per-package test/typecheck commands live in each package's CLAUDE.md.

## Cross-cutting rules

- **Shared Zod contracts are vendored twice**: `server/src/vendor/shared` and
  `client/src/vendor/shared`. They have already drifted (server copy is ahead: `openrouter`
  provider id, `sessionId`, `CommitFilesPayload`, …). When you change a contract, update
  **both** copies, then typecheck server, client and reviewer-core.
- Contracts drive everything: request validation + response serialization on the server,
  types in the client, `Review`/`Finding` types in the engine.
- **Migrations are never applied on boot.** After a schema change: `cd server && pnpm db:generate`
  then `pnpm db:migrate`.
- Secrets (LLM keys, `GITHUB_TOKEN`) live in `~/.devdigest/secrets.json` (fallback: env). Never
  put them in the DB, config objects, logs, or git.
- Do **not** run `docker compose down -v` to "reset" unless the user asks — it deletes the
  `devdigest_pgdata` volume with all imported repos and reviews.
- New features for later milestones go in a new self-contained server module plus, usually, a new
  prompt slot in reviewer-core; the DB schema already has their tables (see `server/src/db/CLAUDE.md`).
- CI is one workflow per package with path filters (`.github/workflows/`). A change in
  `reviewer-core/**` also triggers `server-unit` (server typechecks against its source).

## Project skills (`.claude/skills/`)

fastify-best-practices, drizzle-orm-patterns, postgresql-table-design, zod, typescript-expert,
next-best-practices, react-best-practices, react-testing-library, security, mermaid-diagram.
Each package CLAUDE.md says which ones apply.
