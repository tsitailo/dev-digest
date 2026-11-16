import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../../../../../../messages/en/prReview.json";
import { VerdictBanner } from "./VerdictBanner";

afterEach(cleanup);

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("VerdictBanner (smoke)", () => {
  it("shows verdict label + score + finding/blocker counts", () => {
    renderWithIntl(
      <VerdictBanner
        verdict="request_changes"
        summary="Hardcoded secret introduced."
        score={42}
        findingsCount={1}
        blockers={1}
        agentName="Security Reviewer"
      />,
    );
    expect(screen.getByText("Request changes")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText(/1 findings · 1 blockers/)).toBeInTheDocument();
  });
});

describe("VerdictBanner — run cost line", () => {
  const base = {
    verdict: "comment" as const,
    summary: null,
    score: 80,
    findingsCount: 0,
    blockers: 0,
  };

  it("shows '$cost · in→out' when the run cost is known", () => {
    renderWithIntl(<VerdictBanner {...base} costUsd={0.014} tokensIn={8200} tokensOut={1300} />);
    expect(screen.getByTestId("run-cost-badge")).toHaveTextContent("$0.014 · 8.2K→1.3K");
  });

  it("shows '—' (not $0.00) for a run without cost data", () => {
    renderWithIntl(<VerdictBanner {...base} costUsd={null} tokensIn={null} tokensOut={null} />);
    expect(screen.getByTestId("run-cost-badge")).toHaveTextContent(/^—$/);
  });

  it("hides the line when no cost props are passed", () => {
    renderWithIntl(<VerdictBanner {...base} />);
    expect(screen.queryByTestId("run-cost-badge")).not.toBeInTheDocument();
  });
});
