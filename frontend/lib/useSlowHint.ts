// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { useEffect, useState } from "react";

/**
 * True once `active` has stayed true for `afterMs`. Used to say "waking up the server…"
 * when a request to the API (free Render instance, sleeps when idle) takes a while.
 */
export function useSlowHint(active: boolean, afterMs = 3000) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setSlow(true), afterMs);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [active, afterMs]);
  return active && slow;
}
