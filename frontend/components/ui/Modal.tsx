// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { useMounted } from "@/lib/useMounted";

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** md for short content; lg for galleries and long text. */
  size?: "md" | "lg";
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  // Esc closes, Tab stays inside, focus returns to whatever opened it.
  useFocusTrap(dialogRef, open, onClose);

  // Rendered at the end of <body>: inside a section that moves (parallax), a "fixed"
  // popup would be placed relative to that section instead of the screen.
  const mounted = useMounted();
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-void/80 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduceMotion ? { duration: 0 } : undefined}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.95, y: 10 }}
            transition={
              reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 28 }
            }
            className={`relative max-h-[88vh] w-full overflow-y-auto ${size === "lg" ? "max-w-3xl" : "max-w-lg"} rounded-xl border border-border bg-panel p-6 focus-visible:outline-none`}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="pr-8 font-display text-xl font-bold">{title}</h3>
            {subtitle && <p className="mt-1 font-mono text-sm text-gray-400">{subtitle}</p>}
            <div className="mt-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
