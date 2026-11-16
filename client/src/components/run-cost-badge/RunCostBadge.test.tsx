import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/en/prReview.json";
import { RunCostBadge, type RunCostBadgeProps } from "./RunCostBadge";

afterEach(cleanup);

function renderBadge(props: RunCostBadgeProps) {
  render(
    <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
      <RunCostBadge {...props} />
    </NextIntlClientProvider>,
  );
  return screen.getByTestId("run-cost-badge");
}

describe("RunCostBadge", () => {
  it("compact: cost only", () => {
    expect(renderBadge({ costUsd: 0.012, tokensIn: 8200, tokensOut: 1300 })).toHaveTextContent(/^\$0\.012$/);
  });

  it("compact: unknown cost → '—'", () => {
    expect(renderBadge({ costUsd: null })).toHaveTextContent(/^—$/);
  });

  it("full: cost · in→out", () => {
    expect(
      renderBadge({ variant: "full", costUsd: 0.014, tokensIn: 8200, tokensOut: 1300 }),
    ).toHaveTextContent("$0.014 · 8.2K→1.3K");
  });

  it("full + total tokens: 'N tok · $x' with an exact-value tooltip", () => {
    const el = renderBadge({ variant: "full", tokens: "total", costUsd: 0.0013, tokensIn: 8119, tokensOut: 1000 });
    expect(el).toHaveTextContent("9,119 tok · $0.0013");
    expect(el).toHaveAttribute("title", "$0.0013 · 8119 in / 1000 out tokens");
  });
});
