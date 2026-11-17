/* SeverityCounters — "3 CRITICAL · 5 WARNING · 2 SUGGESTION".
   - variant="full"    PR-level filter bar: each level is a toggle button
                       (aria-pressed); hovering a level pops up its findings.
   - variant="compact" timeline row: icon + count for non-zero levels; hovering
                       the group pops up all of the run's findings.
   Counts/findings are computed by the caller (src/lib/findings-severity.ts).
   Spec: docs/specs/findings-severity-counters.md */
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Icon, SEV } from "@devdigest/ui";
import type { FindingRecord, Severity } from "@devdigest/shared";
import { FindingsPopover, useHoverPopup } from "@/components/findings-popover";
import {
  SEVERITIES,
  groupBySeverity,
  sortBySeverity,
  isCounted,
  type SeverityCounts,
} from "@/lib/findings-severity";
import { s } from "./styles";

type Common = {
  counts: SeverityCounts;
  /** Findings shown in the hover popup (dismissed ones are dropped here). */
  findings?: FindingRecord[];
  onFindingClick?: (f: FindingRecord) => void;
  labelOf?: (f: FindingRecord) => string | null | undefined;
};

const LEVEL_KEY: Record<Severity, "critical" | "warning" | "suggestion"> = {
  CRITICAL: "critical",
  WARNING: "warning",
  SUGGESTION: "suggestion",
};

export function SeverityCounters(
  props: Common & {
    variant?: "full" | "compact";
    /** Currently filtered level (full variant). */
    active?: Severity | null;
    /** full: toggles (null = clear); compact: always the clicked level. */
    onSelect?: (sev: Severity | null) => void;
  },
) {
  return props.variant === "compact" ? <CompactCounters {...props} /> : <FullCounters {...props} />;
}

function FullCounters({
  counts,
  findings = [],
  active = null,
  onSelect,
  onFindingClick,
  labelOf,
}: Common & { active?: Severity | null; onSelect?: (sev: Severity | null) => void }) {
  const t = useTranslations("prReview");
  const grouped = React.useMemo(() => groupBySeverity(findings), [findings]);
  return (
    <div role="group" aria-label={t("severity.groupLabel")} style={s.group}>
      {SEVERITIES.map((sev, i) => (
        <React.Fragment key={sev}>
          {i > 0 && <span aria-hidden style={s.sep}>·</span>}
          <LevelButton
            sev={sev}
            count={counts[sev]}
            findings={grouped[sev]}
            active={active}
            onSelect={onSelect}
            onFindingClick={onFindingClick}
            labelOf={labelOf}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

function LevelButton({
  sev,
  count,
  findings,
  active,
  onSelect,
  onFindingClick,
  labelOf,
}: {
  sev: Severity;
  count: number;
  findings: FindingRecord[];
  active: Severity | null;
  onSelect?: (sev: Severity | null) => void;
  onFindingClick?: (f: FindingRecord) => void;
  labelOf?: (f: FindingRecord) => string | null | undefined;
}) {
  const t = useTranslations("prReview");
  const ref = React.useRef<HTMLButtonElement | null>(null);
  const empty = count === 0;
  const hover = useHoverPopup({ disabled: empty || findings.length === 0 });
  const meta = SEV[sev];
  const I = Icon[meta.icon];
  const label = t(`severity.${LEVEL_KEY[sev]}`);
  const pressed = active === sev;

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-pressed={pressed}
        disabled={empty}
        onClick={() => onSelect?.(pressed ? null : sev)}
        style={s.levelButton({ color: meta.c, bg: meta.bg, pressed, empty, dimmed: active != null && !pressed })}
        {...hover.anchorProps}
      >
        <I size={13} />
        <span className="tnum">{count}</span>
        {label}
      </button>
      <FindingsPopover
        open={hover.open}
        anchorRef={ref}
        title={t("severity.popoverLevelTitle", { count, level: label })}
        findings={findings}
        onClose={hover.close}
        onFindingClick={onFindingClick}
        labelOf={labelOf}
        popupProps={hover.popupProps}
      />
    </>
  );
}

function CompactCounters({
  counts,
  findings = [],
  onSelect,
  onFindingClick,
  labelOf,
}: Common & { onSelect?: (sev: Severity | null) => void }) {
  const t = useTranslations("prReview");
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const open = React.useMemo(() => sortBySeverity(findings.filter(isCounted)), [findings]);
  const hover = useHoverPopup({ disabled: open.length === 0 });
  const levels = SEVERITIES.filter((sev) => counts[sev] > 0);
  if (levels.length === 0) return null;

  return (
    <>
      <span
        ref={ref}
        role="group"
        aria-label={t("severity.groupLabel")}
        style={s.compactGroup}
        {...hover.anchorProps}
      >
        {levels.map((sev) => {
          const meta = SEV[sev];
          const I = Icon[meta.icon];
          return (
            <button
              key={sev}
              type="button"
              aria-label={`${counts[sev]} ${t(`severity.${LEVEL_KEY[sev]}`)}`}
              onClick={() => onSelect?.(sev)}
              style={s.compactButton(meta.c, !!onSelect)}
            >
              <I size={13} />
              <span className="tnum">{counts[sev]}</span>
            </button>
          );
        })}
      </span>
      <FindingsPopover
        open={hover.open}
        anchorRef={ref}
        title={t("severity.popoverTitle", { count: open.length })}
        findings={open}
        onClose={hover.close}
        onFindingClick={onFindingClick}
        labelOf={labelOf}
        popupProps={hover.popupProps}
      />
    </>
  );
}

export default SeverityCounters;
