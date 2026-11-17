"use client";

import React from "react";

/** Delay before the popup opens on hover (avoids flicker on fly-over). */
export const HOVER_OPEN_DELAY_MS = 150;
/** Grace period after leaving the anchor so the pointer can travel into the popup. */
export const HOVER_CLOSE_DELAY_MS = 200;

/**
 * Hover/focus-driven popup state shared by the PR-level severity counters and
 * the timeline row counters. Spread `anchorProps` on the trigger and
 * `popupProps` on the popup: while the pointer (or focus) is on either one the
 * popup stays open; leaving both closes it after a short grace delay.
 */
export function useHoverPopup({
  openDelay = HOVER_OPEN_DELAY_MS,
  closeDelay = HOVER_CLOSE_DELAY_MS,
  disabled = false,
}: { openDelay?: number; closeDelay?: number; disabled?: boolean } = {}) {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const scheduleOpen = React.useCallback(() => {
    if (disabled) return;
    clear();
    timer.current = setTimeout(() => setOpen(true), openDelay);
  }, [clear, disabled, openDelay]);

  const scheduleClose = React.useCallback(() => {
    clear();
    timer.current = setTimeout(() => setOpen(false), closeDelay);
  }, [clear, closeDelay]);

  const close = React.useCallback(() => {
    clear();
    setOpen(false);
  }, [clear]);

  React.useEffect(() => clear, [clear]);
  React.useEffect(() => {
    if (disabled) close();
  }, [disabled, close]);

  return {
    open,
    close,
    anchorProps: {
      onMouseEnter: scheduleOpen,
      onMouseLeave: scheduleClose,
      onFocus: scheduleOpen,
      onBlur: scheduleClose,
    },
    popupProps: {
      onMouseEnter: clear,
      onMouseLeave: scheduleClose,
      onFocus: clear,
      onBlur: scheduleClose,
    },
  };
}
