# client — `@devdigest/web` (Next.js 15 App Router, :3000)

UI route map and API surface per route: `client/README.md`. Design system: `src/vendor/ui/README.md`.

## Commands (pnpm, run in `client/`)

- dev: `pnpm dev` · test: `pnpm test` (vitest + jsdom, fetch mocked) · typecheck: `pnpm typecheck`
- build: `pnpm build`
- API base: `NEXT_PUBLIC_API_BASE` (default `http://localhost:3001`).

## Structure

- `src/app/**/page.tsx` — thin pages; feature UI in colocated `_components/<Name>/` with its own `*.test.tsx`.
  Routes: `/` → `/repos/:repoId/pulls` → `/pulls/:number`, `/agents`, `/agents/:id`, `/settings/:section`,
  `/onboarding` (= **Add repository** screen, not the M5 onboarding generator).
- `src/lib/api.ts` — `apiFetch` + `ApiError` (status `0` = API unreachable). Never call `fetch` directly.
- `src/lib/hooks/*` — every data hook (TanStack Query), re-exported from `hooks/index.ts`.
- `src/components/` — app shell (nav, breadcrumbs, `g`-then-key shortcuts), diff viewer, mermaid, showcase.
- `src/vendor/ui` (`@devdigest/ui`) — vendored design system; `src/vendor/shared` (`@devdigest/shared`) —
  vendored Zod contracts.
- `messages/en/*.json` — next-intl strings, one file per feature.

## Rules

- Data access: add/extend a hook in `src/lib/hooks/`, built on `apiFetch`; components consume hooks.
- Import UI only from the barrel `@devdigest/ui`, never from layer files. Styling = inline styles over CSS
  variables (`var(--accent)` …); no hard-coded colors; use `SeverityBadge`/`CategoryTag` for severities.
- New/changed UI component → add it to the `/showcase` gallery (`src/components/showcase/Showcase.tsx`);
  `src/test/smoke.test.tsx` mounts it.
- User-facing text goes into `messages/en/<feature>.json`, not hard-coded.
- **`src/vendor/shared` is a copy of `server/src/vendor/shared` and has drifted** (missing `openrouter`
  provider id, `sessionId`, …). When a server contract changes, sync this copy.
- Mark client components with `"use client"` only where needed (hooks/state/interaction).
- Many `vendor/ui` components and `messages/en` files (charts, LiveLogStream, ExportWizard, eval, memory, blast…)
  are for later milestones — reuse them rather than creating parallel ones.

## Testing

React Testing Library + jsdom, `fetch` mocked, no API needed. Setup: `src/test/setup.ts`. Real browser
journeys are in `../e2e` — keep visible text used by `e2e/specs/*.flow.json` (`wait --text`) stable or
update the specs.

Skills: next-best-practices, react-best-practices, react-testing-library, typescript-expert.
