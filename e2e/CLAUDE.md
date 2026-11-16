# e2e — deterministic browser flows (agent-browser, no LLM)

**Before work here, read `./INSIGHTS.md`** (see root `CLAUDE.md` → Insights loop).

How flows work, env knobs, coverage table: `e2e/README.md`.

## Commands (**npm**, run in `e2e/`)

- Hermetic (recommended, isolated Postgres :5433 / API :3101 / web :3100, auto-teardown):
  `../scripts/e2e.sh` or `npm run e2e:hermetic`
- Against a running stack: `npm test` — only safe if the dev DB contains **only** the seeded repo.
- typecheck: `npm run typecheck`
- One-time: `npm i -g agent-browser && agent-browser install`

## Rules

- A flow = `specs/NN-name.flow.json`: ordered agent-browser commands run by `run.ts` in one browser
  session. `{BASE}` → `E2E_BASE_URL`. A non-zero exit fails the step; `wait --text` / `wait --url` **are**
  the assertions; optional `assert.stdoutIncludes`.
- Deterministic locators only (`--url`, `--text`, `find role|text|label`). Never use the AI `chat` command.
- Flows are **read-only over seeded data** (`acme/payments-api`, PR #482, seeded agents) — nothing may
  trigger an LLM call or mutate data (e.g. `06-onboarding` renders the form but doesn't submit).
- Flows 02/04/05 assume the seeded repo is the only one (home redirects to the first repo).
- Keep specs in sync with UI text (`client/messages/en`) and seed data (`server/src/db/seed.ts`).
- Never `docker compose down -v` to reset — it wipes the dev volume. The hermetic runner uses an
  ephemeral container instead.
- Failure screenshots: `e2e/test-results/` (git-ignored; uploaded by `e2e-web.yml`).
- `scripts/e2e.sh` is bash (uses `lsof`, `pgrep`) — on Windows run it from Git Bash/WSL.
