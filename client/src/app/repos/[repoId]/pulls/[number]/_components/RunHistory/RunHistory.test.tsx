/**
 * RunHistory — the badge must reflect the review OUTCOME, not the run lifecycle.
 * Regression guard for the "green ✓ done on a run that found 5 blockers" bug:
 * a settled run is colored/labelled by its denormalized blocker/finding counts,
 * and shows the review score ring.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { RunSummary, ReviewRecord, Severity } from "@devdigest/shared";
import { HOVER_OPEN_DELAY_MS } from "@/components/findings-popover";
import { makeFinding, makeReview } from "@/test/factories";
import messages from "../../../../../../../../messages/en/prReview.json";
import { RunHistory } from "./RunHistory";

afterEach(cleanup);

function run(o: Partial<RunSummary>): RunSummary {
  return {
    run_id: "run-1",
    agent_id: "a1",
    agent_name: "Security Reviewer",
    provider: "openrouter",
    model: "deepseek/deepseek-v4-flash",
    status: "done",
    error: null,
    duration_ms: 1000,
    tokens_in: 100,
    tokens_out: 50,
    cost_usd: null,
    findings_count: 0,
    grounding: "0/0 passed",
    ran_at: "2026-06-11T18:44:34.000Z",
    score: null,
    blockers: null,
    ...o,
  };
}

function renderRuns(runs: RunSummary[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
      <RunHistory runs={runs} onOpenTrace={() => {}} />
    </NextIntlClientProvider>,
  );
}

describe("RunHistory — outcome badge", () => {
  it("a done run WITH blockers reads 'rejected' (never green 'done') + shows the score ring", () => {
    renderRuns([run({ status: "done", findings_count: 5, blockers: 5, score: 0 })]);
    expect(screen.getByText("rejected")).toBeInTheDocument();
    expect(screen.queryByText("done")).not.toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument(); // CircularScore renders the number
    expect(screen.getByText(/5 blockers/)).toBeInTheDocument();
  });

  it("a clean done run reads 'approved'", () => {
    renderRuns([run({ status: "done", findings_count: 0, blockers: 0, score: 95 })]);
    expect(screen.getByText("approved")).toBeInTheDocument();
    expect(screen.getByText("95")).toBeInTheDocument();
  });

  it("a done run with non-blocking findings reads 'reviewed'", () => {
    renderRuns([run({ status: "done", findings_count: 3, blockers: 0, score: 72 })]);
    expect(screen.getByText("reviewed")).toBeInTheDocument();
    expect(screen.queryByText(/blockers/)).not.toBeInTheDocument();
  });

  it("a failed run reads 'error'", () => {
    renderRuns([run({ status: "failed", error: "boom", score: null, blockers: null })]);
    expect(screen.getByText("error")).toBeInTheDocument();
  });

  it("a running run reads 'running'", () => {
    renderRuns([run({ status: "running", score: null, blockers: null })]);
    expect(screen.getByText("running")).toBeInTheDocument();
  });
});

describe("RunHistory — run cost badge", () => {
  it("a done run shows total tokens + cost", () => {
    renderRuns([run({ status: "done", tokens_in: 8119, tokens_out: 1000, cost_usd: 0.0013 })]);
    expect(screen.getByTestId("run-cost-badge")).toHaveTextContent("9,119 tok · $0.0013");
  });

  it("a done run without a price shows '—', never $0.00", () => {
    renderRuns([run({ status: "done", cost_usd: null })]);
    expect(screen.getByTestId("run-cost-badge")).toHaveTextContent("150 tok · —");
    expect(screen.queryByText(/\$0\.00/)).not.toBeInTheDocument();
  });

  it("a failed run has no cost badge", () => {
    renderRuns([run({ status: "failed", error: "429 quota", cost_usd: null })]);
    expect(screen.queryByTestId("run-cost-badge")).not.toBeInTheDocument();
  });
});

describe("RunHistory — severity counters", () => {
  function renderWithReview(
    r: RunSummary,
    review: ReviewRecord | undefined,
    onSelectSeverity?: (runId: string, sev: Severity) => void,
  ) {
    const map = new Map<string, ReviewRecord>();
    if (review) map.set(r.run_id, review);
    return render(
      <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
        <RunHistory runs={[r]} onOpenTrace={() => {}} reviewsByRunId={map} onSelectSeverity={onSelectSeverity} />
      </NextIntlClientProvider>,
    );
  }

  const findings = [
    makeFinding({ severity: "CRITICAL", title: "Hardcoded Stripe secret key in commit" }),
    makeFinding({ severity: "CRITICAL", title: "Lethal trifecta" }),
    makeFinding({ severity: "WARNING", title: "Retry-After header omitted on 429" }),
  ];

  it("a done run with a review shows per-level icon counters + blockers instead of 'N findings'", () => {
    renderWithReview(
      run({ status: "done", findings_count: 3, blockers: 2, score: 38 }),
      makeReview({ run_id: "run-1", findings }),
    );
    expect(screen.getByRole("button", { name: "2 CRITICAL" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 WARNING" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /SUGGESTION/ })).not.toBeInTheDocument();
    expect(screen.getByText(/2 blockers/)).toBeInTheDocument();
    expect(screen.queryByText("3 finding(s)")).not.toBeInTheDocument();
  });

  it("hovering the counters pops up the run's findings", () => {
    vi.useFakeTimers();
    try {
      renderWithReview(run({ status: "done", findings_count: 3 }), makeReview({ run_id: "run-1", findings }));
      fireEvent.mouseEnter(screen.getByRole("group", { name: "Findings by severity" }));
      act(() => {
        vi.advanceTimersByTime(HOVER_OPEN_DELAY_MS);
      });
      const dialog = screen.getByRole("dialog", { name: "3 findings" });
      expect(dialog).toHaveTextContent("Hardcoded Stripe secret key in commit");
      expect(dialog).toHaveTextContent("Retry-After header omitted on 429");
    } finally {
      vi.useRealTimers();
    }
  });

  it("clicking a level reports the run + level", () => {
    const onSelect = vi.fn();
    renderWithReview(
      run({ status: "done", findings_count: 3 }),
      makeReview({ run_id: "run-1", findings }),
      onSelect,
    );
    fireEvent.click(screen.getByRole("button", { name: "1 WARNING" }));
    expect(onSelect).toHaveBeenCalledWith("run-1", "WARNING");
  });

  it("falls back to 'N findings' when the run's review is missing", () => {
    renderWithReview(run({ status: "done", findings_count: 4 }), undefined);
    expect(screen.getByText("4 finding(s)")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Findings by severity" })).not.toBeInTheDocument();
  });
});
