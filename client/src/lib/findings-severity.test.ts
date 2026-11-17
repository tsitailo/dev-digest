import { describe, it, expect } from "vitest";
import {
  latestReviewPerAgent,
  countBySeverity,
  groupBySeverity,
  matchesSeverity,
  parseSeverityParam,
  sortBySeverity,
} from "./findings-severity";
import { makeFinding, makeReview } from "../test/factories";

describe("latestReviewPerAgent", () => {
  it("keeps only the newest review of the same agent", () => {
    const old = makeReview({ agent_id: "a1", created_at: "2026-11-17T09:00:00Z" });
    const fresh = makeReview({ agent_id: "a1", created_at: "2026-11-17T10:00:00Z" });
    expect(latestReviewPerAgent([fresh, old])).toEqual([fresh]);
    // order-independent: newest wins even if the input is oldest-first
    expect(latestReviewPerAgent([old, fresh])).toEqual([fresh]);
  });

  it("keeps one review per distinct agent, in input order", () => {
    const sec = makeReview({ agent_id: "a1" });
    const perf = makeReview({ agent_id: "a2" });
    expect(latestReviewPerAgent([sec, perf])).toEqual([sec, perf]);
  });

  it("falls back to agent name, then to the review itself, when agent_id is null", () => {
    const byName1 = makeReview({ agent_id: null, agent_name: "X", created_at: "2026-11-17T09:00:00Z" });
    const byName2 = makeReview({ agent_id: null, agent_name: "X", created_at: "2026-11-17T10:00:00Z" });
    const anon1 = makeReview({ agent_id: null, agent_name: null });
    const anon2 = makeReview({ agent_id: null, agent_name: null });
    expect(latestReviewPerAgent([byName2, byName1, anon1, anon2])).toEqual([byName2, anon1, anon2]);
  });
});

describe("countBySeverity / groupBySeverity", () => {
  it("counts open findings per level; dismissed drop out, accepted stay", () => {
    const findings = [
      makeFinding({ severity: "CRITICAL" }),
      makeFinding({ severity: "CRITICAL", dismissed_at: "2026-11-17T10:00:00Z" }),
      makeFinding({ severity: "WARNING", accepted_at: "2026-11-17T10:00:00Z" }),
      makeFinding({ severity: "SUGGESTION" }),
      makeFinding({ severity: "SUGGESTION" }),
    ];
    expect(countBySeverity(findings)).toEqual({ CRITICAL: 1, WARNING: 1, SUGGESTION: 2 });
    const g = groupBySeverity(findings);
    expect(g.CRITICAL).toHaveLength(1);
    expect(g.SUGGESTION).toHaveLength(2);
  });

  it("returns zeros for no findings", () => {
    expect(countBySeverity([])).toEqual({ CRITICAL: 0, WARNING: 0, SUGGESTION: 0 });
  });
});

describe("matchesSeverity / sortBySeverity", () => {
  it("null filter matches everything; a level matches only its open findings", () => {
    const crit = makeFinding({ severity: "CRITICAL" });
    const dismissed = makeFinding({ severity: "CRITICAL", dismissed_at: "x" });
    expect(matchesSeverity(dismissed, null)).toBe(true);
    expect(matchesSeverity(crit, "CRITICAL")).toBe(true);
    expect(matchesSeverity(crit, "WARNING")).toBe(false);
    expect(matchesSeverity(dismissed, "CRITICAL")).toBe(false);
  });

  it("sorts most severe first", () => {
    const s = makeFinding({ severity: "SUGGESTION" });
    const w = makeFinding({ severity: "WARNING" });
    const c = makeFinding({ severity: "CRITICAL" });
    expect(sortBySeverity([s, w, c]).map((f) => f.severity)).toEqual(["CRITICAL", "WARNING", "SUGGESTION"]);
  });
});

describe("parseSeverityParam", () => {
  it.each([
    ["critical", "CRITICAL"],
    ["CRITICAL", "CRITICAL"],
    ["Warning", "WARNING"],
    ["suggestion", "SUGGESTION"],
    ["info", null],
    ["foo", null],
    ["", null],
    [null, null],
  ])("%s → %s", (raw, expected) => {
    expect(parseSeverityParam(raw)).toBe(expected);
  });
});
