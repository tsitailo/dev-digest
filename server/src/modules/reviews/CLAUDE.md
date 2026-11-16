# modules/reviews — run a review, persist findings, stream run events

Routes (`routes.ts`): `POST /pulls/:id/review` (`{agentId}` | `{all:true}`, limited to 10/min),
`GET /runs/:id/events` (SSE, replay-first), `GET /runs/:id/trace`, `GET /pulls/:id/reviews`,
`POST /findings/:id/(accept|dismiss)`.

## Flow

`service.ts` resolves target agents → creates runs → `run-executor.ts`:
1. `diff-loader.ts` loads the PR diff (fails all runs if it can't).
2. Per agent (`runOneAgent`): resolve LLM via `container.llm(agent.provider)`.
3. If repo intel is on (global `REPO_INTEL_ENABLED` **and** agent `repoIntel !== false`) gather context
   from `container.repoIntel`: callers digest, repo map, high-blast-radius rank note. Each is best-effort:
   failure is logged to the run log and the slot is omitted.
4. Call `reviewPullRequest` from `@devdigest/reviewer-core` (prompt → LLM → structured output → grounding);
   `helpers.ts` re-exports the engine's `reduceReviews` / `sliceDiff`.
5. Persist review + findings, status `done`; on error/cancel persist status + error + log so far.

Persistence is split in `repository/{pull,review,run}.repo.ts` behind `repository.ts`
(exposed as `container.reviewRepo`).

## Rules

- Untrusted inputs (diff, PR title/body, repo files) go to the engine as data; the engine wraps them.
  Never concatenate them into the system prompt yourself.
- Don't trust the model's score — it's recomputed from grounded findings in reviewer-core.
- Context-gathering must stay **degrade-not-throw**: an unindexed repo means a diff-only review, not an error.
- Every run state change must be persisted and emitted on the SSE run bus (`platform/sse.ts`);
  `run-logger.ts` / `trace-builder.ts` build the log and trace.
- Stale `running` runs are reaped on boot (`reapStaleRuns`) — keep that in mind when adding statuses.
- New prompt context for a milestone = new optional slot in `reviewer-core` `PromptParts` + gathering here.

## Tests

`test/reviews.it.test.ts` (lifecycle incl. grounding, real Postgres), `test/reviews-helpers.test.ts`,
`test/prompt-callers.test.ts`. Use `MockLLMProvider` via container overrides.
