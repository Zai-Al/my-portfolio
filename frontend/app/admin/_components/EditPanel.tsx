// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useFocusTrap } from "@/lib/useFocusTrap";

/**
 * Slide-over panel on the right for one add/edit form. Esc, the backdrop or ✕ ask
 * `onClose`, which decides whether unsaved changes can be dropped. Focus stays
 * inside while it is open and goes back to the button that opened it.
 */
export default function EditPanel({
  open,
  title,
  subtitle,
  onClose,
  footer,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  useFocusTrap(panelRef, open, onClose);

  // The page behind doesn't scroll while the panel is open.
  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, [open]);

  const instant = { duration: 0 };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-void/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? instant : { duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-panel-title"
            className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l border-border bg-panel shadow-2xl"
            initial={reduceMotion ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduceMotion ? undefined : { x: "100%" }}
            transition={reduceMotion ? instant : { type: "spring", stiffness: 320, damping: 34 }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="min-w-0">
                {subtitle && <p className="font-mono text-xs text-accent">{subtitle}</p>}
                <h2 id="edit-panel-title" className="truncate font-display text-lg font-semibold">
                  {title}
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded px-2 py-1 text-gray-400 hover:bg-white/5 hover:text-white"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

            <footer className="border-t border-border px-5 py-3">{footer}</footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
