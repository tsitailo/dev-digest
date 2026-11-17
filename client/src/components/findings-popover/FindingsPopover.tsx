/* FindingsPopover — floating card listing findings, opened by hovering a
   severity counter (PR-level counters and timeline rows). Portaled to <body>
   with fixed positioning so accordion/row `overflow: hidden` never clips it.
   Spec: docs/specs/findings-severity-counters.md */
"use client";

import React from "react";
import { createPortal } from "react-dom";
import {
  Icon,
  SeverityBadge,
  CategoryTag,
  ConfidenceNum,
  type Severity,
  type Category,
} from "@devdigest/ui";
import type { FindingRecord } from "@devdigest/shared";
import { s, POPOVER_WIDTH, POPOVER_MAX_HEIGHT, POPOVER_GAP } from "./styles";

type Placement = { top: number; left: number };

function lineLabel(f: Pick<FindingRecord, "start_line" | "end_line">): string {
  return f.start_line === f.end_line ? `${f.start_line}` : `${f.start_line}-${f.end_line}`;
}

/** Below the anchor, flipped above when there is no room; clamped to the viewport. */
function placeFor(anchor: HTMLElement): Placement {
  const r = anchor.getBoundingClientRect();
  const vw = window.innerWidth || POPOVER_WIDTH;
  const vh = window.innerHeight || POPOVER_MAX_HEIGHT;
  const below = vh - r.bottom;
  const top =
    below < POPOVER_MAX_HEIGHT && r.top > below
      ? Math.max(8, r.top - POPOVER_GAP - POPOVER_MAX_HEIGHT)
      : r.bottom + POPOVER_GAP;
  const left = Math.max(8, Math.min(r.left, vw - POPOVER_WIDTH - 8));
  return { top, left };
}

export function FindingsPopover({
  open,
  anchorRef,
  title,
  findings,
  onClose,
  onFindingClick,
  labelOf,
  popupProps,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  title: string;
  findings: FindingRecord[];
  onClose: () => void;
  /** Clicking a finding row (e.g. filter by its level + jump to its run). */
  onFindingClick?: (f: FindingRecord) => void;
  /** Optional secondary label per finding (e.g. the agent that raised it). */
  labelOf?: (f: FindingRecord) => string | null | undefined;
  /** Hover handlers from `useHoverPopup` — keep it open while hovered. */
  popupProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const titleId = React.useId();
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const [place, setPlace] = React.useState<Placement | null>(null);

  React.useLayoutEffect(() => {
    if (open && anchorRef.current) setPlace(placeFor(anchorRef.current));
  }, [open, anchorRef]);

  // Esc + click-outside close it (hover-out is handled by useHoverPopup).
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popupRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, onClose, anchorRef]);

  if (!open || findings.length === 0 || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={popupRef}
      role="dialog"
      aria-labelledby={titleId}
      style={s.popup(place)}
      {...popupProps}
    >
      <div id={titleId} style={s.header}>
        <Icon.AlertOctagon size={14} />
        {title}
      </div>
      <div style={s.list}>
        {findings.map((f) => {
          const label = labelOf?.(f);
          const body = (
            <>
              <div style={s.titleRow}>
                <SeverityBadge severity={f.severity as Severity} compact />
                <span style={s.title}>{f.title}</span>
                <CategoryTag category={f.category as Category} />
              </div>
              <div style={s.metaRow}>
                <span className="mono" style={s.location}>
                  {f.file}:{lineLabel(f)}
                </span>
                <ConfidenceNum value={f.confidence} />
                {label && <span style={s.agent}>{label}</span>}
              </div>
              <div style={s.rationale}>{f.rationale}</div>
            </>
          );
          return onFindingClick ? (
            <button
              key={f.id}
              type="button"
              data-finding-id={f.id}
              style={s.itemButton}
              onClick={() => {
                onFindingClick(f);
                onClose();
              }}
            >
              {body}
            </button>
          ) : (
            <div key={f.id} data-finding-id={f.id} style={s.item}>
              {body}
            </div>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}

export default FindingsPopover;
