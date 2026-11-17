import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/en/prReview.json";
import { SeverityCounters } from "./SeverityCounters";
import { HOVER_OPEN_DELAY_MS } from "../findings-popover";
import { makeFinding } from "../../test/factories";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderUi(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
      {ui}
    </NextIntlClientProvider>,
  );
}

const COUNTS = { CRITICAL: 3, WARNING: 5, SUGGESTION: 2 };

describe("SeverityCounters (full)", () => {
  it("renders '3 CRITICAL · 5 WARNING · 2 SUGGESTION' as toggle buttons", () => {
    renderUi(<SeverityCounters counts={COUNTS} />);
    expect(screen.getByRole("group", { name: "Findings by severity" })).toBeInTheDocument();
    for (const name of ["3 CRITICAL", "5 WARNING", "2 SUGGESTION"]) {
      const btn = screen.getByRole("button", { name });
      expect(btn).toHaveAttribute("aria-pressed", "false");
      expect(btn).toBeEnabled();
    }
  });

  it("click selects a level; clicking the active level clears it", () => {
    const onSelect = vi.fn();
    const { rerender } = renderUi(<SeverityCounters counts={COUNTS} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "3 CRITICAL" }));
    expect(onSelect).toHaveBeenLastCalledWith("CRITICAL");

    rerender(
      <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
        <SeverityCounters counts={COUNTS} onSelect={onSelect} active="CRITICAL" />
      </NextIntlClientProvider>,
    );
    const active = screen.getByRole("button", { name: "3 CRITICAL" });
    expect(active).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(active);
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("a zero level is disabled", () => {
    renderUi(<SeverityCounters counts={{ CRITICAL: 0, WARNING: 1, SUGGESTION: 0 }} />);
    expect(screen.getByRole("button", { name: "0 CRITICAL" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "1 WARNING" })).toBeEnabled();
  });

  it("hovering a level pops up only that level's open findings", () => {
    vi.useFakeTimers();
    const findings = [
      makeFinding({ severity: "CRITICAL", title: "Hardcoded secret" }),
      makeFinding({ severity: "CRITICAL", title: "Dismissed crit", dismissed_at: "x" }),
      makeFinding({ severity: "WARNING", title: "Missing header" }),
    ];
    renderUi(
      <SeverityCounters counts={{ CRITICAL: 1, WARNING: 1, SUGGESTION: 0 }} findings={findings} />,
    );
    fireEvent.mouseEnter(screen.getByRole("button", { name: "1 CRITICAL" }));
    act(() => {
      vi.advanceTimersByTime(HOVER_OPEN_DELAY_MS);
    });
    const dialog = screen.getByRole("dialog", { name: "1 CRITICAL findings" });
    expect(dialog).toHaveTextContent("Hardcoded secret");
    expect(dialog).not.toHaveTextContent("Missing header");
    expect(dialog).not.toHaveTextContent("Dismissed crit");
  });
});

describe("SeverityCounters (compact)", () => {
  it("shows icon+count only for non-zero levels and reports the clicked level", () => {
    const onSelect = vi.fn();
    renderUi(
      <SeverityCounters
        variant="compact"
        counts={{ CRITICAL: 2, WARNING: 0, SUGGESTION: 1 }}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole("button", { name: "2 CRITICAL" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /WARNING/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "1 SUGGESTION" }));
    expect(onSelect).toHaveBeenCalledWith("SUGGESTION");
  });

  it("renders nothing when every level is zero", () => {
    const { container } = renderUi(
      <SeverityCounters variant="compact" counts={{ CRITICAL: 0, WARNING: 0, SUGGESTION: 0 }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("hovering the group pops up all of the run's findings, most severe first", () => {
    vi.useFakeTimers();
    const findings = [
      makeFinding({ severity: "WARNING", title: "Second" }),
      makeFinding({ severity: "CRITICAL", title: "First" }),
    ];
    renderUi(
      <SeverityCounters variant="compact" counts={{ CRITICAL: 1, WARNING: 1, SUGGESTION: 0 }} findings={findings} />,
    );
    fireEvent.mouseEnter(screen.getByRole("group", { name: "Findings by severity" }));
    act(() => {
      vi.advanceTimersByTime(HOVER_OPEN_DELAY_MS);
    });
    const dialog = screen.getByRole("dialog", { name: "2 findings" });
    expect(dialog.textContent!.indexOf("First")).toBeLessThan(dialog.textContent!.indexOf("Second"));
  });
});
