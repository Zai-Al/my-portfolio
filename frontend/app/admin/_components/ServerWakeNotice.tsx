// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect, useState } from "react";
import type { ServerStatus } from "../_hooks/useServerWake";

/** Shown instead of the content pages until the API answers. */
export default function ServerWakeNotice({
  status,
  startedAt,
  onRetry,
}: {
  status: Exclude<ServerStatus, "ready">;
  startedAt: number;
  onRetry: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.round((now - startedAt) / 1000));

  if (status === "down" || status === "database") {
    return (
      <div
        role="alert"
        className="rounded border border-red-500/40 bg-red-500/10 px-4 py-4 font-mono text-sm text-red-300"
      >
        <p>
          {status === "database"
            ? "The server is up, but it can't reach the database. If Supabase paused the project, restore it in the Supabase dashboard."
            : "The server didn't answer. Check the Render dashboard (a failed deploy or suspended service), then try again."}
        </p>
        <button
          onClick={onRetry}
          className="mt-3 rounded border border-red-400/50 px-3 py-1 text-xs hover:bg-red-500/10"
        >
          try again
        </button>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded border border-border bg-panel/60 px-4 py-4 font-mono text-sm text-gray-300"
    >
      <p className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-2 w-2 animate-pulse rounded-full bg-accent motion-reduce:animate-none"
        />
        {status === "checking" ? "Connecting to the server…" : "Waking up the server…"}
        {status === "waking" && <span className="text-gray-500">{seconds}s</span>}
      </p>
      {status === "waking" && (
        <p className="mt-2 text-xs text-gray-500">
          The free hosting plan sleeps after a while without visitors. Starting again takes up to a
          minute; your content loads by itself once it&apos;s up.
        </p>
      )}
    </div>
  );
}
