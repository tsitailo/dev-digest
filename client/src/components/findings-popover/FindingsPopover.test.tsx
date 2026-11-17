/* FindingsPopover + useHoverPopup: hover opens after a delay, a grace period
   lets the pointer travel into the popup, Esc / click-outside close it. */
import React from "react";
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import type { FindingRecord } from "@devdigest/shared";
import {
  FindingsPopover,
  useHoverPopup,
  HOVER_OPEN_DELAY_MS,
  HOVER_CLOSE_DELAY_MS,
} from "./index";
import { makeFinding } from "../../test/factories";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function Harness({
  findings,
  onFindingClick,
}: {
  findings: FindingRecord[];
  onFindingClick?: (f: FindingRecord) => void;
}) {
  const ref = React.useRef<HTMLButtonElement | null>(null);
  const hover = useHoverPopup({ disabled: findings.length === 0 });
  return (
    <>
      <button ref={ref} type="button" {...hover.anchorProps}>
        anchor
      </button>
      <button type="button">elsewhere</button>
      <FindingsPopover
        open={hover.open}
        anchorRef={ref}
        title={`${findings.length} findings`}
        findings={findings}
        onClose={hover.close}
        onFindingClick={onFindingClick}
        popupProps={hover.popupProps}
      />
    </>
  );
}

const tick = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

const FINDING = makeFinding({
  severity: "CRITICAL",
  category: "security",
  title: "Hardcoded Stripe secret key in commit",
  file: "src/config.ts",
  start_line: 12,
  end_line: 12,
  confidence: 0.98,
  rationale: "Line 12 contains a literal sk_live_ key.",
});

describe("FindingsPopover", () => {
  it("opens only after the hover delay and shows the finding details", () => {
    render(<Harness findings={[FINDING]} />);
    fireEvent.mouseEnter(screen.getByText("anchor"));
    tick(HOVER_OPEN_DELAY_MS - 1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    tick(1);
    const dialog = screen.getByRole("dialog", { name: "1 findings" });
    expect(dialog).toHaveTextContent("Hardcoded Stripe secret key in commit");
    expect(dialog).toHaveTextContent("src/config.ts:12");
    expect(dialog).toHaveTextContent("98% conf");
    expect(dialog).toHaveTextContent("sk_live_");
  });

  it("a quick fly-over never opens it", () => {
    render(<Harness findings={[FINDING]} />);
    const anchor = screen.getByText("anchor");
    fireEvent.mouseEnter(anchor);
    tick(50);
    fireEvent.mouseLeave(anchor);
    tick(HOVER_OPEN_DELAY_MS + HOVER_CLOSE_DELAY_MS);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes after the grace delay on unhover, but stays open when the pointer moves into it", () => {
    render(<Harness findings={[FINDING]} />);
    const anchor = screen.getByText("anchor");
    fireEvent.mouseEnter(anchor);
    tick(HOVER_OPEN_DELAY_MS);

    fireEvent.mouseLeave(anchor);
    fireEvent.mouseEnter(screen.getByRole("dialog"));
    tick(HOVER_CLOSE_DELAY_MS * 2);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByRole("dialog"));
    tick(HOVER_CLOSE_DELAY_MS - 1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    tick(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on keyboard focus and closes on Escape", () => {
    render(<Harness findings={[FINDING]} />);
    fireEvent.focus(screen.getByText("anchor"));
    tick(HOVER_OPEN_DELAY_MS);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on a click outside", () => {
    render(<Harness findings={[FINDING]} />);
    fireEvent.mouseEnter(screen.getByText("anchor"));
    tick(HOVER_OPEN_DELAY_MS);
    fireEvent.mouseDown(screen.getByText("elsewhere"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clicking a finding calls onFindingClick and closes the popup", () => {
    const onFindingClick = vi.fn();
    render(<Harness findings={[FINDING]} onFindingClick={onFindingClick} />);
    fireEvent.mouseEnter(screen.getByText("anchor"));
    tick(HOVER_OPEN_DELAY_MS);
    fireEvent.click(screen.getByRole("button", { name: /Hardcoded Stripe secret key/ }));
    expect(onFindingClick).toHaveBeenCalledWith(FINDING);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("never opens without findings", () => {
    render(<Harness findings={[]} />);
    fireEvent.mouseEnter(screen.getByText("anchor"));
    tick(HOVER_OPEN_DELAY_MS * 2);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
