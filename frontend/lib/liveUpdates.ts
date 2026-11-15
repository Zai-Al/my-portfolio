// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// Live updates: after an admin save, /api/revalidate clears the page cache and then sends
// "changed" on the private Supabase Realtime channel "content". Open pages listen and reload
// their data in place. Who may listen or send is decided by RLS policies on
// realtime.messages (anyone may receive; only the admin with two-factor may send).

import { useEffect, useRef } from "react";
import { CONTENT_CHANGED_EVENT, CONTENT_CHANNEL } from "./liveChannel";

/** Why the data should be reloaded: a save was announced, or messages may have been missed. */
export type ContentChangeReason = "changed" | "resync";

// A save fires one message, but a reorder or several quick saves can fire a few; wait for them to settle.
const DEBOUNCE_MS = 500;
// Background tabs may lose the connection; after this long hidden, reload on return in case we missed a save.
const RESYNC_AFTER_HIDDEN_MS = 60_000;

/**
 * Calls `onChange` when content changes elsewhere: right after an admin save ("changed"), and
 * after a reconnect or a long time in the background, when a message may have been missed ("resync").
 * Supabase is loaded only once the page is up, so visitors don't download it before first paint.
 */
export function useContentChanges(onChange: (reason: ContentChangeReason) => void, enabled = true) {
  // Always call the latest callback without resubscribing on every render.
  const callback = useRef(onChange);
  useEffect(() => {
    callback.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let hiddenAt: number | null = null;
    let cleanupChannel: (() => void) | undefined;

    const fire = (reason: ContentChangeReason) => {
      clearTimeout(timer);
      timer = setTimeout(() => callback.current(reason), DEBOUNCE_MS);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
      } else if (hiddenAt !== null) {
        if (Date.now() - hiddenAt > RESYNC_AFTER_HIDDEN_MS) fire("resync");
        hiddenAt = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    import("@/lib/supabaseClient").then(({ supabase }) => {
      if (stopped) return;
      let subscribedBefore = false;
      const channel = supabase
        .channel(CONTENT_CHANNEL, { config: { private: true } })
        .on("broadcast", { event: CONTENT_CHANGED_EVENT }, () => fire("changed"))
        .subscribe((status) => {
          if (status !== "SUBSCRIBED") return;
          // The first join is the normal start; a later one is a reconnect after a drop.
          if (subscribedBefore) fire("resync");
          subscribedBefore = true;
        });
      cleanupChannel = () => void supabase.removeChannel(channel);
    });

    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      cleanupChannel?.();
    };
  }, [enabled]);
}
