/**
 * Formatting for run cost + token usage (Run Cost Badge).
 *
 * Rule: missing data renders as "—", never "$0.00" — a run with no price is
 * "unknown", not "free". A real zero (free model) renders as "$0".
 */

const DASH = "—";

/** USD → "$0.0013" (<1¢), "$0.012" (<$1), "$1.25"; null/undefined → "—". */
export function formatCost(usd: number | null | undefined): string {
  if (usd == null || !Number.isFinite(usd)) return DASH;
  if (usd === 0) return "$0";
  if (usd < 0.0001) return "<$0.0001";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

/** Token count → "940", "8.2K", "15K", "1.2M". */
export function formatTokens(n: number): string {
  if (n < 1000) return String(n);
  const [value, unit] = n < 1_000_000 ? [n / 1000, "K"] : [n / 1_000_000, "M"];
  return `${value.toFixed(1).replace(/\.0$/, "")}${unit}`;
}

/** In→out pair → "8.2K→1.3K"; null when either side is unknown. */
export function formatTokenPair(
  tokensIn: number | null | undefined,
  tokensOut: number | null | undefined,
): string | null {
  if (tokensIn == null || tokensOut == null) return null;
  return `${formatTokens(tokensIn)}→${formatTokens(tokensOut)}`;
}

/** Total tokens → "9,119" (caller appends the localized unit); null when either side is unknown. */
export function formatTokenTotal(
  tokensIn: number | null | undefined,
  tokensOut: number | null | undefined,
): string | null {
  if (tokensIn == null || tokensOut == null) return null;
  return (tokensIn + tokensOut).toLocaleString("en-US");
}
