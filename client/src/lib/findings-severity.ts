/* Findings-by-severity helpers for the PR page counters + filter.
   Pure functions over already-loaded reviews — no server round-trip.
   Spec: docs/specs/findings-severity-counters.md */
// Type-only on purpose: @devdigest/shared is raw TS with `.js` ESM specifiers that
// Next's bundler cannot resolve — a runtime (value) import breaks the page build.
import type { FindingRecord, ReviewRecord, Severity } from "@devdigest/shared";

/** Display order of the severity levels (most severe first). */
export const SEVERITIES: readonly Severity[] = ["CRITICAL", "WARNING", "SUGGESTION"];

/** Sort weight per severity (lower = shown first). INFO kept for legacy rows. */
export const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  WARNING: 1,
  SUGGESTION: 2,
  INFO: 3,
};

export type SeverityCounts = Record<Severity, number>;

/** Identity of the agent behind a review; falls back to the review itself. */
function agentKey(r: ReviewRecord): string {
  return r.agent_id ?? r.agent_name ?? `review:${r.id}`;
}

function ts(iso: string): number {
  const n = Date.parse(iso);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * The newest review of each agent — re-runs of the same agent must not
 * double-count the same problems. Keeps the input order of the survivors.
 */
export function latestReviewPerAgent(reviews: ReviewRecord[]): ReviewRecord[] {
  const newest = new Map<string, ReviewRecord>();
  for (const r of reviews) {
    const k = agentKey(r);
    const cur = newest.get(k);
    if (!cur || ts(r.created_at) > ts(cur.created_at)) newest.set(k, r);
  }
  const keep = new Set(newest.values());
  return reviews.filter((r) => keep.has(r));
}

/** A finding counts while it is still open: dismissed ones drop out. */
export function isCounted(f: FindingRecord): boolean {
  return !f.dismissed_at;
}

/** Open (non-dismissed) findings per severity. */
export function countBySeverity(findings: FindingRecord[]): SeverityCounts {
  const counts: SeverityCounts = { CRITICAL: 0, WARNING: 0, SUGGESTION: 0 };
  for (const f of findings) {
    if (isCounted(f) && f.severity in counts) counts[f.severity as Severity] += 1;
  }
  return counts;
}

/** Open findings grouped by severity, each group in input order. */
export function groupBySeverity(findings: FindingRecord[]): Record<Severity, FindingRecord[]> {
  const out: Record<Severity, FindingRecord[]> = { CRITICAL: [], WARNING: [], SUGGESTION: [] };
  for (const f of findings) {
    if (isCounted(f) && f.severity in out) out[f.severity as Severity].push(f);
  }
  return out;
}

/** True when the finding passes the severity filter (null = no filter). */
export function matchesSeverity(f: FindingRecord, sev: Severity | null): boolean {
  return sev == null || (f.severity === sev && isCounted(f));
}

/** Open findings sorted most-severe first (stable within a level). */
export function sortBySeverity(findings: FindingRecord[]): FindingRecord[] {
  return [...findings].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9),
  );
}

/** `?sev=critical` → "CRITICAL"; anything unknown → null (no filter). */
export function parseSeverityParam(raw: string | null | undefined): Severity | null {
  if (!raw) return null;
  const up = raw.toUpperCase();
  return (SEVERITIES as readonly string[]).includes(up) ? (up as Severity) : null;
}
