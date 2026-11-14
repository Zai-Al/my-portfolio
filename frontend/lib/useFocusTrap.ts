// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { useEffect, useEffectEvent, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Open traps, newest last. Only the top one reacts to keys, so a confirm dialog opened
// over the edit panel gets Esc/Tab, not both at once.
const stack: symbol[] = [];

/**
 * While `active`, keeps Tab / Shift+Tab inside `ref`, closes on Escape, and puts
 * focus back where it was when it deactivates. Focus moves to the element marked
 * `data-autofocus`, else the first field, else the popup itself (if it has tabIndex -1),
 * else the first button.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape: () => void
) {
  // Always calls the latest onEscape without re-running the effect (which would move focus).
  const escape = useEffectEvent(onEscape);

  useEffect(() => {
    if (!active) return;
    const id = Symbol("focus-trap");
    stack.push(id);
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const items = () => Array.from(root?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    // A popup that can take focus itself (tabIndex -1) starts there, so no button shows a
    // focus ring when it opens with the mouse; Tab then moves into it as usual.
    const selfFocusable = root?.getAttribute("tabindex") === "-1" ? root : null;
    (
      root?.querySelector<HTMLElement>("[data-autofocus]") ??
      root?.querySelector<HTMLElement>("input, textarea, select") ??
      selfFocusable ??
      items()[0]
    )?.focus();

    function onKey(e: KeyboardEvent) {
      if (stack[stack.length - 1] !== id) return;
      if (e.key === "Escape") {
        e.preventDefault();
        escape();
        return;
      }
      if (e.key !== "Tab") return;
      const list = items();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      stack.splice(stack.indexOf(id), 1);
      previous?.focus();
    };
  }, [ref, active]);
}
