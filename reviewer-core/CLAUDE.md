# reviewer-core — `@devdigest/reviewer-core` (pure review engine)

diff → prompt → LLM → structured output → grounded findings. Pipeline diagram and public API:
`reviewer-core/README.md`.

## Commands (**npm**, run in `reviewer-core/`)

- install: `npm ci` (required for the server to boot — it imports this package's raw source)
- test: `npm test` · typecheck/build: `npm run typecheck` (the package never emits JS)

## Rules

- **Pure**: no DB, GitHub, filesystem or env access. The only side effect is the injected `LLMProvider`.
  Keep it that way — it's what makes the engine mock-testable and reusable from a CI runner (M6).
- Public surface = `src/index.ts`. Anything the server uses must be exported there.
- Types (`Review`, `Finding`, `Verdict`, `LLMProvider`, …) come from `@devdigest/shared`, which resolves
  to `../server/src/vendor/shared`. Change contracts there (and mirror into `client/src/vendor/shared`).
- `zod` is pinned to this package's own `node_modules` via tsconfig `paths` to avoid two zod instances.
- **Security invariants — do not weaken:**
  - `INJECTION_GUARD` is appended to every system prompt in `assemblePrompt` (`prompt.ts`). Untrusted text
    (diff, PR body, repo files) is fenced via `wrapUntrusted`. No keyword/denylist scanning instead.
  - `groundFindings` (`grounding.ts`) drops any finding whose cited line isn't in the diff; the score is
    recomputed from surviving findings. Never trust the model's self-reported score.
- Structured output: Zod → JSON Schema (`toJsonSchema`) and `parseWithRepair` in `llm/structured.ts`.
- `llm/openrouter.ts` is the single OpenRouter provider (the server injects a cost estimator).
- Optional prompt slots (`skills`, `memory`, `specs`, `callers`) and `review/reduce.ts` (map-reduce),
  `output/to-review.ts` (CI payload) exist for later milestones; omitted slots simply drop their section.

## Testing

Hermetic vitest with a stubbed `LLMProvider` (`test/*.test.ts`): prompt assembly, grounding, `toReview`,
full `run`. No keys, no network. Server tests also exercise this code through the platform shims.

Skills: typescript-expert, zod, security.
