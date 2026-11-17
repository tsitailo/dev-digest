"use client";

import React, { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Icon, Badge, Button, SectionLabel, EmptyState } from "@devdigest/ui";
import { SeverityCounters } from "@/components/severity-counters";
import {
  latestReviewPerAgent,
  countBySeverity,
  matchesSeverity,
} from "@/lib/findings-severity";
import { RunStatus } from "../RunStatus";
import { RunHistory } from "../RunHistory/RunHistory";
import { ReviewRunAccordion } from "../ReviewRunAccordion";
import { s } from "./styles";
import type { FindingRecord, ReviewRecord, RunSummary, PrCommit, Severity } from "@devdigest/shared";
import type { UseMutationResult } from "@tanstack/react-query";

interface FindingsTabProps {
  prId: string | null;
  liveRunIds: string[];
  reviewRunning: boolean;
  lethalTrifecta: FindingRecord[];
  runs: ReviewRecord[];
  prRuns: RunSummary[] | undefined;
  prCommits: PrCommit[];
  cancelMutation: UseMutationResult<any, any, string, any>;
  /** owner/repo + head sha — used to deep-link a finding's file:line to GitHub. */
  repoFullName?: string | null;
  headSha?: string | null;
  onOpenTrace: (id: string) => void;
  onDelete: (id: string) => void;
  onRunDone: () => void;
  /** PR-level severity filter (`?sev=`), null = all levels. */
  severity?: Severity | null;
  onSeverityChange?: (sev: Severity | null) => void;
}

export function FindingsTab({
  prId,
  liveRunIds,
  reviewRunning,
  lethalTrifecta,
  runs,
  prRuns,
  prCommits,
  cancelMutation,
  repoFullName,
  headSha,
  onOpenTrace,
  onDelete,
  onRunDone,
  severity = null,
  onSeverityChange,
}: FindingsTabProps) {
  const t = useTranslations("prReview");
  const handleCancelAll = useCallback(() => {
    liveRunIds.forEach((id) => cancelMutation.mutate(id));
  }, [liveRunIds, cancelMutation]);

  const handleOpenFirstTrace = useCallback(() => {
    if (liveRunIds[0]) onOpenTrace(liveRunIds[0]);
  }, [liveRunIds, onOpenTrace]);

  const handleOpenTrace = useCallback(
    (id: string) => {
      onOpenTrace(id);
    },
    [onOpenTrace],
  );

  const handleDelete = useCallback(
    (id: string) => {
      onDelete(id);
    },
    [onDelete],
  );

  // Timeline → Review-runs navigation: clicking an agent name in the timeline
  // opens + scrolls to that run's accordion below. The nonce re-triggers the
  // scroll even when the same run is clicked twice.
  const [target, setTarget] = React.useState<{ runId: string; n: number } | null>(null);
  const handleGoToReview = useCallback((runId: string) => {
    setTarget((p) => ({ runId, n: (p?.n ?? 0) + 1 }));
  }, []);

  // Severity counters: latest review per agent, open (non-dismissed) findings.
  const counted = React.useMemo(() => latestReviewPerAgent(runs), [runs]);
  const countedFindings = React.useMemo(() => counted.flatMap((r) => r.findings), [counted]);
  const counts = React.useMemo(() => countBySeverity(countedFindings), [countedFindings]);
  const reviewOfFinding = React.useMemo(() => {
    const m = new Map<string, ReviewRecord>();
    for (const r of runs) for (const f of r.findings) m.set(f.id, r);
    return m;
  }, [runs]);
  const reviewsByRunId = React.useMemo(() => {
    const m = new Map<string, ReviewRecord>();
    for (const r of runs) if (r.run_id) m.set(r.run_id, r);
    return m;
  }, [runs]);
  const agentOf = useCallback(
    (f: FindingRecord) => reviewOfFinding.get(f.id)?.agent_name ?? null,
    [reviewOfFinding],
  );

  // Under a filter only the counted runs with matches stay, so the number of
  // visible cards equals the number on the active counter.
  const visibleRuns = React.useMemo(
    () =>
      severity
        ? counted.filter((r) => r.findings.some((f) => matchesSeverity(f, severity)))
        : runs,
    [severity, counted, runs],
  );
  const hiddenRuns = runs.length - visibleRuns.length;

  const handleSelectSeverity = useCallback(
    (sev: Severity | null) => onSeverityChange?.(sev),
    [onSeverityChange],
  );
  // Popup → click a finding: filter by its level and jump to its run.
  const handleFindingClick = useCallback(
    (f: FindingRecord) => {
      onSeverityChange?.(f.severity);
      const runId = reviewOfFinding.get(f.id)?.run_id;
      if (runId) handleGoToReview(runId);
    },
    [onSeverityChange, reviewOfFinding, handleGoToReview],
  );
  // Timeline row → click a level icon: same filter + scroll to that run.
  const handleTimelineSeverity = useCallback(
    (runId: string, sev: Severity) => {
      onSeverityChange?.(sev);
      handleGoToReview(runId);
    },
    [onSeverityChange, handleGoToReview],
  );

  return (
    <section>
      {liveRunIds.length > 0 && (
        <div style={s.liveRunSection}>
          <SectionLabel
            icon="Sparkles"
            right={
              <div style={s.cancelActions}>
                <Button
                  kind="danger"
                  size="sm"
                  icon="X"
                  loading={cancelMutation.isPending}
                  onClick={handleCancelAll}
                >
                  Cancel
                </Button>
                <Button kind="ghost" size="sm" icon="FileText" onClick={handleOpenFirstTrace}>
                  Open run trace
                </Button>
              </div>
            }
          >
            Live review
          </SectionLabel>
          <RunStatus runIds={liveRunIds} onDone={onRunDone} />
        </div>
      )}

      {reviewRunning && (
        <div style={s.reviewInProgress}>
          <Icon.RefreshCw size={16} style={{ color: "var(--accent)", animation: "ddspin 1s linear infinite" }} />
          <span style={s.reviewInProgressText}>Review in progress…</span>
          <span style={s.reviewInProgressSub}>
            the agent is analyzing the diff — this can take a while on large PRs.
          </span>
        </div>
      )}

      {lethalTrifecta.length > 0 && (
        <div style={s.lethalTrifecta}>
          <Icon.Shield size={16} style={{ color: "var(--crit)" }} />
          <span style={s.lethalTrifectaTitle}>Lethal Trifecta detected</span>
          <Badge color="var(--crit)" bg="transparent">
            {lethalTrifecta.length} finding(s)
          </Badge>
        </div>
      )}

      {((prRuns && prRuns.length > 0) || prCommits.length > 0) && (
        <div style={s.timelineSection}>
          <SectionLabel
            icon="Activity"
            right={<span style={{ fontSize: 12, color: "var(--text-muted)" }}>runs &amp; commits · newest first</span>}
          >
            Timeline
          </SectionLabel>
          <RunHistory
            runs={prRuns ?? []}
            commits={prCommits}
            onOpenTrace={handleOpenTrace}
            onGoToReview={handleGoToReview}
            onDelete={handleDelete}
            reviewsByRunId={reviewsByRunId}
            onSelectSeverity={onSeverityChange ? handleTimelineSeverity : undefined}
          />
        </div>
      )}

      <SectionLabel
        icon="AlertOctagon"
        right={<span style={{ fontSize: 12, color: "var(--text-muted)" }}>grouped by run · newest first</span>}
      >
        Review runs
      </SectionLabel>
      {runs.length > 0 && (
        <div style={s.severityBar}>
          <SeverityCounters
            counts={counts}
            findings={countedFindings}
            active={severity}
            onSelect={handleSelectSeverity}
            onFindingClick={handleFindingClick}
            labelOf={agentOf}
          />
          <span style={s.severityHint}>{t("severity.scopeHint")}</span>
          <span style={{ flex: 1 }} />
          {severity && (
            <Button kind="ghost" size="sm" icon="X" onClick={() => handleSelectSeverity(null)}>
              {t("severity.clearFilter")}
            </Button>
          )}
        </div>
      )}
      {runs.length === 0 ? (
        reviewRunning || liveRunIds.length > 0 ? null : (
          <EmptyState
            icon="Sparkles"
            title="No findings yet"
            body="Run a review to generate findings. Use Run Review ▾ above (run all enabled agents or a specific one)."
          />
        )
      ) : severity && visibleRuns.length === 0 ? (
        <EmptyState
          icon="Filter"
          title={t("panel.noMatchTitle")}
          body={t("severity.noMatches", { level: t(`severity.${severity.toLowerCase()}`) })}
        />
      ) : (
        prId &&
        visibleRuns.map((review, i) => (
          <ReviewRunAccordion
            key={review.id}
            review={review}
            prId={prId}
            defaultOpen={i === 0}
            repoFullName={repoFullName}
            headSha={headSha}
            targetRunId={target?.runId ?? null}
            targetNonce={target?.n ?? 0}
            severity={severity}
            forceOpen={severity != null}
          />
        ))
      )}
      {severity && hiddenRuns > 0 && (
        <div style={s.hiddenRuns}>{t("severity.hiddenRuns", { count: hiddenRuns })}</div>
      )}
    </section>
  );
}
