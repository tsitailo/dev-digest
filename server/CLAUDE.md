# server — `@devdigest/api` (Fastify 5 + Drizzle/Postgres, :3001)

Imports repos and PRs, indexes repos (`repo-intel`), stores agents, runs reviews through
`reviewer-core`. Full API map, request/DI flow diagram and env table: `server/README.md`.

## Commands (pnpm, run in `server/`)

- dev: `pnpm dev` (tsx watch) · typecheck: `pnpm typecheck`
- unit (no Docker): `pnpm exec vitest run --exclude '**/*.it.test.ts'`
- integration (Docker, testcontainers): `pnpm exec vitest run .it.test`
- one file: `pnpm exec vitest run test/grounding.test.ts`
- DB: `pnpm db:generate` · `pnpm db:migrate` · `pnpm db:seed`

Requires `reviewer-core/node_modules` (`cd ../reviewer-core && npm ci`) — the API imports
the engine's raw source and crashes with `ERR_MODULE_NOT_FOUND` otherwise.

## Structure

- `src/app.ts` — builds the app: config → db → `Container` (decorated as `app.container`) →
  plugins (helmet, cors, SSE, rate-limit) → error handler → modules. Reaps stale `running` runs on boot.
- `src/platform/container.ts` — **DI composition root**. Adapters are lazy getters; tests replace them
  via `ContainerOverrides`. `container.llm(id)` / `container.github()` are async (read secrets).
- `src/modules/<name>/` — `routes.ts` (Fastify plugin) → `service.ts` → `repository.ts`.
  Registered statically in `src/modules/index.ts`.
- `src/adapters/` — ports implementations (llm, github, git, astgrep, codeindex, depgraph, tokenizer,
  secrets, auth, embedder) + `mocks.ts` for tests.
- `src/platform/` — errors, jobs (p-queue mirrored to `jobs` table), SSE run bus, resilience, price book.
- `src/db/` — see `src/db/CLAUDE.md`. Review pipeline: `src/modules/reviews/CLAUDE.md`.
  Indexer: `src/modules/repo-intel/CLAUDE.md`.

## Rules

- **Add a module**: create `modules/<name>/routes.ts` exporting a default plugin, add one import +
  one entry in `modules/index.ts`. No filesystem autoload (not portable across tsx/vitest), even though
  `@fastify/autoload` is in deps.
- **Routes are schema-first**: `appBase.withTypeProvider<ZodTypeProvider>()` and declare
  `schema: { params, body, querystring }` with Zod (reuse `@devdigest/shared` and
  `modules/_shared/schemas.ts`). Don't hand-parse `req.body` in new code (invalid input → 422 automatically).
- **Tenancy**: every handler calls `getContext(container, req)` and scopes queries by `workspaceId`.
- **Errors**: throw `AppError` subclasses from `platform/errors.ts` (`NotFoundError`, `ValidationError`,
  `ExternalServiceError`, `ConfigError`); the global handler renders `{ error: { code, message, details } }`.
- Get collaborators from the container (`container.agentsRepo`, `container.reviewRepo`, `container.repoIntel`)
  — don't import another module's repository directly.
- Long/async work (clone, import, indexing) goes through `container.jobs` (register a handler by kind).
- Expensive endpoints get a per-route `config.rateLimit`; SSE and `/health*` are exempt.
- Imports use `.js` extensions on relative paths (ESM).
- Secrets: read only through `container.secrets` (`LocalSecretsProvider`); after writing a key call
  `container.invalidateSecretCaches()`.

## Testing

- DB-backed test (imports `test/helpers/pg.ts`) **must** be named `*.it.test.ts`; everything else is hermetic.
- Mock the outside world with `src/adapters/mocks.ts` (`MockLLMProvider`, `MockGitClient`, …) via
  `buildApp({ overrides })`; no network, no keys.
- Typological coverage: one happy path + the edge that matters, at the seams (routes, adapters, pipeline).

## Gotchas

- `platform/{grounding,prompt,structured}.ts` are **re-export shims** of `@devdigest/reviewer-core` —
  edit the real code in `reviewer-core/src`.
- `platform/model-router.ts` (`routeModel`, `PromptCache`) is currently unused (reserved for later milestones).
- `src/prompts/onboarding.system.md` is not wired yet (M5 onboarding generator).
- Seeded agents use provider `openrouter` → without `OPENROUTER_API_KEY` a review fails with `ConfigError`.
- `LOG_LEVEL` may be empty; `NODE_ENV=test` silences logs and disables the global rate limit.

Skills: fastify-best-practices, zod, drizzle-orm-patterns, typescript-expert, security.
