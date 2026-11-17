import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { FindingRecord } from "@devdigest/shared";
import messages from "../../../../../../../../messages/en/prReview.json";

vi.mock("../../../../../../../lib/hooks/reviews", () => ({
  useFindingAction: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { FindingsPanel } from "./FindingsPanel";

afterEach(cleanup);

const FINDINGS: FindingRecord[] = [
  {
    id: "f1",
    severity: "CRITICAL",
    category: "security",
    title: "Hardcoded secret",
    file: "src/config.ts",
    start_line: 11,
    end_line: 11,
    rationale: "A secret is committed.",
    suggestion: null,
    confidence: 0.95,
    kind: "finding",
    trifecta_components: null,
    evidence: null,
    review_id: "r1",
    accepted_at: null,
    dismissed_at: null,
  },
];

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("FindingsPanel (smoke)", () => {
  it("renders the toolbar + a finding card", () => {
    renderWithIntl(<FindingsPanel findings={FINDINGS} prId="pr1" />);
    expect(screen.getByText("Hide low confidence")).toBeInTheDocument();
    expect(screen.getByText("Hardcoded secret")).toBeInTheDocument();
  });

  it("shows the empty state when nothing matches", () => {
    renderWithIntl(<FindingsPanel findings={[]} prId="pr1" />);
    expect(screen.getByText("No findings match")).toBeInTheDocument();
  });
});

describe("FindingsPanel — severity filter", () => {
  const MIXED: FindingRecord[] = [
    { ...FINDINGS[0]!, id: "c1", severity: "CRITICAL", title: "Crit one" },
    { ...FINDINGS[0]!, id: "w1", severity: "WARNING", title: "Warn open" },
    { ...FINDINGS[0]!, id: "w2", severity: "WARNING", title: "Warn dismissed", dismissed_at: "2026-11-17T10:00:00Z" },
  ];

  it("without a filter shows every finding (dismissed included)", () => {
    renderWithIntl(<FindingsPanel findings={MIXED} prId="pr1" />);
    expect(screen.getByText("Crit one")).toBeInTheDocument();
    expect(screen.getByText("Warn dismissed")).toBeInTheDocument();
  });

  it("with severity=WARNING shows only open WARNING findings", () => {
    renderWithIntl(<FindingsPanel findings={MIXED} prId="pr1" severity="WARNING" />);
    expect(screen.getByText("Warn open")).toBeInTheDocument();
    expect(screen.queryByText("Crit one")).not.toBeInTheDocument();
    expect(screen.queryByText("Warn dismissed")).not.toBeInTheDocument();
  });
});
