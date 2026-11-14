// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { useCallback, useEffect, useState } from "react";
import { checkHealth } from "@/lib/api/http";

/**
 * checking = first ping in flight · waking = no answer yet (Render is starting, up to ~1 min)
 * ready = API and database up · down = gave up, or the API answered but its database didn't.
 */
export type ServerStatus = "checking" | "waking" | "ready" | "down" | "database";

const GIVE_UP_MS = 90_000;
const RETRY_EVERY_MS = 3_000;

/**
 * Wakes the API as soon as /admin opens (so it starts while the password and code are
 * being typed) and reports how that's going. `retry` starts over after "down".
 */
export function useServerWake() {
  const [status, setStatus] = useState<ServerStatus>("checking");
  const [attempt, setAttempt] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    const deadline = Date.now() + GIVE_UP_MS;
    const slow = setTimeout(
      () => !cancelled && setStatus((s) => (s === "checking" ? "waking" : s)),
      1500
    );

    (async () => {
      let last: Awaited<ReturnType<typeof checkHealth>> = "unreachable";
      while (!cancelled && Date.now() < deadline) {
        last = await checkHealth(Math.max(1000, Math.min(20_000, deadline - Date.now())));
        if (cancelled) return;
        if (last === "ok") return setStatus("ready");
        await new Promise((r) => setTimeout(r, RETRY_EVERY_MS));
      }
      if (!cancelled) setStatus(last === "degraded" ? "database" : "down");
    })();

    return () => {
      cancelled = true;
      clearTimeout(slow);
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setStatus("checking");
    setStartedAt(Date.now());
    setAttempt((a) => a + 1);
  }, []);

  return { status, startedAt, retry };
}
