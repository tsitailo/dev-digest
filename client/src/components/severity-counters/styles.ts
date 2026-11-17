import type { CSSProperties } from "react";

export const s = {
  group: { display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" } satisfies CSSProperties,
  sep: { color: "var(--text-muted)", fontSize: 13 } satisfies CSSProperties,
  levelButton: ({
    color,
    bg,
    pressed,
    empty,
    dimmed,
  }: {
    color: string;
    bg: string;
    pressed: boolean;
    empty: boolean;
    dimmed: boolean;
  }): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 6,
    border: `1px solid ${pressed ? color : "var(--border)"}`,
    background: pressed ? bg : "transparent",
    color: empty ? "var(--text-muted)" : color,
    opacity: empty ? 0.55 : dimmed ? 0.6 : 1,
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: "0.04em",
    cursor: empty ? "default" : "pointer",
    fontFamily: "inherit",
  }),
  compactGroup: { display: "inline-flex", alignItems: "center", gap: 10 } satisfies CSSProperties,
  compactButton: (color: string, clickable: boolean): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: 0,
    background: "none",
    border: "none",
    borderBottom: `1px dotted ${color}`,
    color,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: clickable ? "pointer" : "default",
  }),
} as const;
