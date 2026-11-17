# INSIGHTS — client

> Non-obvious, evidence-backed lessons for working in this module. Read before work; treat as
> high-confidence guidance unless told otherwise. **Append-only**: written by the `engineering-insights`
> skill (runs automatically at the end of every task that edited files), pruned monthly via
> `/engineering-insights prune`. A draft under review: spot-check before trusting.
>
> Every entry (Session Notes and Open Questions included) has a date AND a `path:line`:
> `- YYYY-MM-DD · Pattern|Mistake|Context|Decision|Session|Question · <actionable essence> — evidence: path/file.ts:LINE`

## What Works

- 2026-11-17 · Pattern · Render hover popups/popovers over PR-page rows via `createPortal(…, document.body)` with `position: fixed` from the anchor's `getBoundingClientRect()`: `ReviewRunAccordion` clips its children with `overflow: hidden`, so an absolutely-positioned popup inside it gets cut off. — evidence: client/src/components/findings-popover/FindingsPopover.tsx:91, client/src/app/repos/[repoId]/pulls/[number]/_components/ReviewRunAccordion/ReviewRunAccordion.tsx:77

## What Doesn't Work

## Codebase Patterns

- 2026-11-16 · Context · The showcase `Gallery` is mounted in the smoke test WITHOUT a `NextIntlClientProvider`, so an app component that calls `useTranslations` crashes it. Wrap such components in their own provider inside the showcase. — evidence: client/src/test/smoke.test.tsx:18, client/src/components/showcase/Showcase.tsx:134

## Tool / Library Notes

- 2026-11-17 · Context · `pnpm typecheck` fails with TS2742 ("inferred type of 's' cannot be named without a reference to .pnpm/csstype") when an exported `styles.ts` object contains `{ ...base, … } satisfies CSSProperties`. Fix: hoist that entry to a separately declared `const x: CSSProperties = {…}` and reference it from the object. — evidence: client/src/components/findings-popover/styles.ts:15
- 2026-11-17 · Context · `@testing-library/user-event` is NOT a dependency (only `react` + `jest-dom`); test hover/delay UI with `fireEvent.mouseEnter/mouseLeave` + `vi.useFakeTimers()` + `act(() => vi.advanceTimersByTime(ms))` instead of adding a package. — evidence: client/package.json:28, client/src/components/findings-popover/FindingsPopover.test.tsx:68

## Decisions

- 2026-11-17 · Decision · PR severity counters are client-only, derived from `usePrReviews`: latest review per agent (`agent_id ?? agent_name ?? review.id`), dismissed findings excluded (same rule as `blockers`), filter state in the URL `?sev=critical`. Under a filter only counted runs with matches are listed, so the number of cards always equals the counter. Why: summing every run double-counts re-runs, and no server/contract change was needed (avoids `ReviewDto` drift). Spec: docs/specs/findings-severity-counters.md — evidence: client/src/lib/findings-severity.ts:33, client/src/app/repos/[repoId]/pulls/[number]/page.tsx:71

## Recurring Errors & Fixes

- 2026-11-17 · Mistake · Symptom: `next dev` → every page 500 with `Module not found: Can't resolve './contracts/findings.js'` in `src/vendor/shared/index.ts`, while `pnpm typecheck` and `pnpm test` are green → Cause: a VALUE import from `@devdigest/shared` (e.g. a Zod schema like `Severity.safeParse`); the vendored package uses `.js` ESM specifiers that tsc/vitest resolve to `.ts` but Next's bundler does not → Fix: import from `@devdigest/shared` with `import type` only; re-declare needed runtime constants locally. — evidence: client/src/vendor/shared/index.ts:17, client/src/lib/findings-severity.ts:6

## Session Notes

- 2026-11-16 · Session · Run Cost Badge (RunCostBadge in list, verdict banner, timeline, trace); added: Context (showcase intl). — evidence: client/src/components/run-cost-badge/RunCostBadge.tsx:26
- 2026-11-17 · Session · Findings severity counters + filter + hover popup (FindingsTab bar, RunHistory rows); added: Pattern (portal popups), Context (TS2742 csstype), Context (no user-event), Decision (counting scope). — evidence: client/src/components/severity-counters/SeverityCounters.tsx:1
- 2026-11-17 · Session · Fixed dev-server 500 after severity counters (value import from shared); added: Mistake (shared must be type-only in client). — evidence: client/src/lib/findings-severity.ts:6

## Open Questions
