// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { useEffect, useRef } from "react";

/** Signed in but untouched for this long = logged out. */
export const IDLE_LIMIT_MS = 15 * 60_000;
const CHECK_EVERY_MS = 15_000;
// mousemove fires constantly; writing the time once every few seconds is plenty.
const WRITE_EVERY_MS = 5_000;
const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"];

// The last-activity time lives in localStorage, next to the Supabase login, so it is shared
// by every admin tab (working in one keeps the others alive) and survives closing the
// browser (coming back after 15 minutes finds the login expired, not still open).
const KEY = "admin:lastActivity";
let memoryFallback = 0; // when storage is blocked (private window, blocked site data)

function readLastActivity(): number {
  try {
    const stored = Number(localStorage.getItem(KEY));
    if (stored > 0) return stored;
  } catch {
    /* storage blocked: use the in-memory copy */
  }
  return memoryFallback;
}

/** Records "the admin did something just now". Called on activity and right at login. */
export function markActive() {
  const now = Date.now();
  memoryFallback = now;
  try {
    localStorage.setItem(KEY, String(now));
  } catch {
    /* storage blocked: the in-memory copy still covers this tab */
  }
}

/** True when nothing happened for IDLE_LIMIT_MS. No record at all counts as idle. */
export function isIdle(): boolean {
  return Date.now() - readLastActivity() >= IDLE_LIMIT_MS;
}

/**
 * While `active` (someone is signed in), tracks activity and calls `onIdle` once nothing has
 * happened for 15 minutes. Timers are slowed down in background tabs, so the time is also
 * checked as soon as the tab is shown again.
 */
export function useIdleLogout(active: boolean, onIdle: () => void) {
  const onIdleRef = useRef(onIdle);
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    if (!active) return;
    let fired = false;
    let lastWrite = 0;

    const check = () => {
      if (fired || !isIdle()) return;
      fired = true;
      onIdleRef.current();
    };
    const onActivity = () => {
      // Activity after the limit doesn't count: the login has already expired.
      if (fired || isIdle()) return check();
      const now = Date.now();
      if (now - lastWrite < WRITE_EVERY_MS) return;
      lastWrite = now;
      markActive();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    for (const e of ACTIVITY_EVENTS)
      window.addEventListener(e, onActivity, { passive: true, capture: true });
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(timer);
      for (const e of ACTIVITY_EVENTS) window.removeEventListener(e, onActivity, { capture: true });
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, [active]);
}
