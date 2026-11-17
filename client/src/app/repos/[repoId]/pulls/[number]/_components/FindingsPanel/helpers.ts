import type { FindingRecord, Severity } from "@devdigest/shared";
import { matchesSeverity, sortBySeverity } from "@/lib/findings-severity";
import { LOW_CONFIDENCE_THRESHOLD } from "./constants";

/**
 * Optionally drop low-confidence findings, keep only one severity level (open
 * findings only — dismissed ones are not counted by the severity counters, so
 * they are not shown under the filter either), and sort by severity.
 */
export function visibleFindings(
  findings: FindingRecord[],
  hideLow: boolean,
  severity: Severity | null = null,
): FindingRecord[] {
  let shown = findings;
  if (hideLow) shown = shown.filter((f) => f.confidence >= LOW_CONFIDENCE_THRESHOLD);
  if (severity) shown = shown.filter((f) => matchesSeverity(f, severity));
  return sortBySeverity(shown);
}
