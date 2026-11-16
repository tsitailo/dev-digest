/* RunCostBadge — cost (+ tokens) of one agent run.
   compact: "$0.012"                    (PR list COST column)
   full:    "$0.014 · 8.2K→1.3K"        (verdict banner)
   full + tokens="total": "9,119 tok · $0.0013"  (Agent runs timeline)
   Unknown cost renders "—", never "$0.00". */
"use client";

import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { formatCost, formatTokenPair, formatTokenTotal } from "@/lib/format-cost";

export interface RunCostBadgeProps {
  costUsd: number | null | undefined;
  tokensIn?: number | null;
  tokensOut?: number | null;
  variant?: "compact" | "full";
  /** full only: "split" = in→out after the cost; "total" = summed tokens before it. */
  tokens?: "split" | "total";
  style?: CSSProperties;
}

const base: CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
};

export function RunCostBadge({
  costUsd,
  tokensIn,
  tokensOut,
  variant = "compact",
  tokens = "split",
  style,
}: RunCostBadgeProps) {
  const t = useTranslations("prReview.costBadge");
  const cost = formatCost(costUsd);
  let text = cost;
  if (variant === "full") {
    if (tokens === "total") {
      const total = formatTokenTotal(tokensIn, tokensOut);
      text = total ? `${total} ${t("tok")} · ${cost}` : cost;
    } else {
      const pair = formatTokenPair(tokensIn, tokensOut);
      text = pair ? `${cost} · ${pair}` : cost;
    }
  }

  const title = [
    costUsd != null ? `$${costUsd}` : t("unknown"),
    tokensIn != null && tokensOut != null ? t("tokensTitle", { in: tokensIn, out: tokensOut }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <span className="mono" data-testid="run-cost-badge" title={title} style={{ ...base, ...style }}>
      {text}
    </span>
  );
}

export default RunCostBadge;
