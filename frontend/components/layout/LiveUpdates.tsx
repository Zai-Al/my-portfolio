// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useContentChanges, type ContentChangeReason } from "@/lib/liveUpdates";

const NOTICE_MS = 3000;

/**
 * Keeps the open page up to date: when I save in the admin portal, the page reloads its data
 * in place (scroll position, open popups and the chat stay as they are) and briefly says so.
 * A quiet re-check after a reconnect or a long time in the background shows no notice.
 */
export default function LiveUpdates() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [, startTransition] = useTransition();
  const [showNotice, setShowNotice] = useState(false);

  const onChange = useCallback(
    (reason: ContentChangeReason) => {
      startTransition(() => router.refresh());
      if (reason === "changed") setShowNotice(true);
    },
    [router]
  );
  useContentChanges(onChange);

  useEffect(() => {
    if (!showNotice) return;
    const timer = setTimeout(() => setShowNotice(false), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [showNotice]);

  return (
    // Always mounted so screen readers announce the text when it appears.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-4 z-40 -translate-x-1/2"
    >
      <AnimatePresence>
        {showNotice && (
          <motion.p
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={
              reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -8 }
            }
            transition={{ duration: 0.2 }}
            className="rounded border border-accent/40 bg-void/90 px-3 py-1.5 font-mono text-xs text-accent shadow-lg backdrop-blur"
          >
            <span aria-hidden="true">● </span>Updated just now
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
