import type { CSSProperties } from "react";

export const POPOVER_WIDTH = 460;
export const POPOVER_MAX_HEIGHT = 380;
export const POPOVER_GAP = 6;

const itemBase: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 5,
  padding: "10px 4px",
  borderTop: "1px solid var(--border)",
};

const itemButton: CSSProperties = {
  ...itemBase,
  width: "100%",
  textAlign: "left",
  background: "none",
  borderLeft: "none",
  borderRight: "none",
  borderBottom: "none",
  font: "inherit",
  color: "inherit",
  cursor: "pointer",
};

export const s = {
  popup: (place: { top: number; left: number } | null): CSSProperties => ({
    position: "fixed",
    top: place?.top ?? 0,
    left: place?.left ?? 0,
    visibility: place ? "visible" : "hidden",
    zIndex: 1000,
    width: POPOVER_WIDTH,
    maxWidth: "calc(100vw - 16px)",
    maxHeight: POPOVER_MAX_HEIGHT,
    overflowY: "auto",
    padding: "12px 14px 6px",
    borderRadius: 10,
    border: "1px solid var(--border-strong)",
    background: "var(--bg-elevated)",
    boxShadow: "var(--shadow-modal)",
  }),
  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    paddingBottom: 8,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
  } satisfies CSSProperties,
  list: { display: "flex", flexDirection: "column" } satisfies CSSProperties,
  item: itemBase,
  itemButton,
  titleRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } satisfies CSSProperties,
  title: { fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" } satisfies CSSProperties,
  metaRow: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" } satisfies CSSProperties,
  location: { fontSize: 12, color: "var(--accent-text)" } satisfies CSSProperties,
  agent: { fontSize: 12, color: "var(--text-muted)" } satisfies CSSProperties,
  rationale: {
    fontSize: 12.5,
    lineHeight: 1.45,
    color: "var(--text-secondary)",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  } satisfies CSSProperties,
} as const;
