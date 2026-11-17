/* Test data factories for findings/reviews (severity counters + filter tests). */
import type { FindingRecord, ReviewRecord } from "@devdigest/shared";

let seq = 0;

export function makeFinding(o: Partial<FindingRecord> = {}): FindingRecord {
  seq += 1;
  return {
    id: `f${seq}`,
    severity: "WARNING",
    category: "bug",
    title: `Finding ${seq}`,
    file: "src/a.ts",
    start_line: 1,
    end_line: 1,
    rationale: "Because.",
    suggestion: null,
    confidence: 0.9,
    kind: "finding",
    trifecta_components: null,
    evidence: null,
    review_id: "r1",
    accepted_at: null,
    dismissed_at: null,
    ...o,
  };
}

export function makeReview(o: Partial<ReviewRecord> = {}): ReviewRecord {
  seq += 1;
  return {
    id: `r${seq}`,
    pr_id: "pr1",
    agent_id: "a1",
    run_id: `run${seq}`,
    agent_name: "Security Reviewer",
    kind: "review",
    verdict: "comment",
    summary: null,
    score: 70,
    model: "m",
    cost_usd: null,
    tokens_in: null,
    tokens_out: null,
    grounding: null,
    created_at: "2026-11-17T10:00:00.000Z",
    findings: [],
    ...o,
  };
}
