/* FindingsTab — PR-level severity counters + filter.
   Counts come from the latest review per agent (re-runs don't double-count),
   dismissed findings don't count, and under a filter the number of visible
   finding cards equals the number on the active counter. */
import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReviewRecord, Severity } from "@devdigest/shared";
import messages from "../../../../../../../../messages/en/prReview.json";
import { makeFinding, makeReview } from "@/test/factories";

vi.mock("../../../../../../../lib/hooks/reviews", () => ({
  useFindingAction: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteReview: () => ({ mutate: vi.fn(), isPending: false }),
  useRunEvents: () => ({}),
}));

import { FindingsTab } from "./FindingsTab";

afterEach(cleanup);

// Security agent ran twice (old run must not count), Performance agent once.
const SEC_OLD = makeReview({
  agent_id: "sec",
  agent_name: "Security Reviewer",
  created_at: "2026-11-17T08:00:00Z",
  findings: [makeFinding({ severity: "CRITICAL", title: "Old crit (stale run)" })],
});
const SEC_NEW = makeReview({
  agent_id: "sec",
  agent_name: "Security Reviewer",
  created_at: "2026-11-17T10:00:00Z",
  findings: [
    makeFinding({ severity: "CRITICAL", title: "Hardcoded Stripe secret key in commit" }),
    makeFinding({ severity: "CRITICAL", title: "Lethal trifecta" }),
    makeFinding({ severity: "CRITICAL", title: "Dismissed crit", dismissed_at: "2026-11-17T11:00:00Z" }),
    makeFinding({ severity: "WARNING", title: "Retry-After header omitted on 429" }),
  ],
});
const PERF = makeReview({
  agent_id: "perf",
  agent_name: "Performance Reviewer",
  created_at: "2026-11-17T09:00:00Z",
  findings: [
    makeFinding({ severity: "WARNING", title: "N+1 query" }),
    makeFinding({ severity: "SUGGESTION", title: "Cache the limiter config" }),
  ],
});
const RUNS: ReviewRecord[] = [SEC_NEW, PERF, SEC_OLD]; // newest-first, as the API returns

function Harness({ initial = null }: { initial?: Severity | null }) {
  const [severity, setSeverity] = React.useState<Severity | null>(initial);
  return (
    <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
      <FindingsTab
        prId="pr1"
        liveRunIds={[]}
        reviewRunning={false}
        lethalTrifecta={[]}
        runs={RUNS}
        prRuns={[]}
        prCommits={[]}
        cancelMutation={{ mutate: vi.fn(), isPending: false } as never}
        onOpenTrace={() => {}}
        onDelete={() => {}}
        onRunDone={() => {}}
        severity={severity}
        onSeverityChange={setSeverity}
      />
    </NextIntlClientProvider>
  );
}

describe("FindingsTab — severity counters", () => {
  it("counts only the latest run per agent and skips dismissed findings", () => {
    render(<Harness />);
    const group = screen.getByRole("group", { name: "Findings by severity" });
    expect(within(group).getByRole("button", { name: "2 CRITICAL" })).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: "2 WARNING" })).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: "1 SUGGESTION" })).toBeInTheDocument();
    expect(screen.getByText("latest run per agent")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear filter" })).not.toBeInTheDocument();
  });

  it("clicking CRITICAL leaves exactly the counted CRITICAL findings, then Clear restores all runs", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "2 CRITICAL" }));

    expect(screen.getByRole("button", { name: "2 CRITICAL" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Hardcoded Stripe secret key in commit")).toBeInTheDocument();
    expect(screen.getByText("Lethal trifecta")).toBeInTheDocument();
    expect(document.querySelectorAll("[data-finding-id]")).toHaveLength(2); // == counter
    expect(screen.queryByText("Retry-After header omitted on 429")).not.toBeInTheDocument();
    expect(screen.queryByText("Dismissed crit")).not.toBeInTheDocument();
    expect(screen.queryByText("Old crit (stale run)")).not.toBeInTheDocument();
    // PERF (no CRITICAL) + SEC_OLD (stale) are hidden
    expect(screen.getByText("2 other run(s) hidden while filtering")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear filter" }));
    expect(screen.getByRole("button", { name: "2 CRITICAL" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText(/hidden while filtering/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Security Reviewer|Performance Reviewer/).length).toBeGreaterThanOrEqual(3);
  });

  it("filtering by WARNING force-opens runs that are collapsed by default", () => {
    render(<Harness />);
    // PERF is not the first run → collapsed until the filter opens it
    expect(screen.queryByText("N+1 query")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "2 WARNING" }));
    expect(screen.getByText("N+1 query")).toBeInTheDocument();
    expect(screen.getByText("Retry-After header omitted on 429")).toBeInTheDocument();
    expect(document.querySelectorAll("[data-finding-id]")).toHaveLength(2);
    expect(screen.queryByText("Cache the limiter config")).not.toBeInTheDocument();
  });

  it("a filter from the URL with no matches shows an empty state", () => {
    const only = [makeReview({ agent_id: "x", findings: [makeFinding({ severity: "WARNING" })] })];
    render(
      <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
        <FindingsTab
          prId="pr1"
          liveRunIds={[]}
          reviewRunning={false}
          lethalTrifecta={[]}
          runs={only}
          prRuns={[]}
          prCommits={[]}
          cancelMutation={{ mutate: vi.fn(), isPending: false } as never}
          onOpenTrace={() => {}}
          onDelete={() => {}}
          onRunDone={() => {}}
          severity="CRITICAL"
          onSeverityChange={() => {}}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText("No open CRITICAL findings in the latest runs.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "0 CRITICAL" })).toBeDisabled();
  });

  it("renders no counters when the PR has no reviews", () => {
    render(
      <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
        <FindingsTab
          prId="pr1"
          liveRunIds={[]}
          reviewRunning={false}
          lethalTrifecta={[]}
          runs={[]}
          prRuns={[]}
          prCommits={[]}
          cancelMutation={{ mutate: vi.fn(), isPending: false } as never}
          onOpenTrace={() => {}}
          onDelete={() => {}}
          onRunDone={() => {}}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.queryByRole("group", { name: "Findings by severity" })).not.toBeInTheDocument();
    expect(screen.getByText("No findings yet")).toBeInTheDocument();
  });
});
