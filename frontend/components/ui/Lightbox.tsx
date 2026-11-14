// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useRef } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { useMounted } from "@/lib/useMounted";

const isStorage = (url: string) => url.includes("/storage/v1/object/public/portfolio-media/");

/**
 * One picture as large as the screen allows. Esc, ✕ or a click outside the picture close
 * it (only it, not the popup underneath); ‹ › flip through the set.
 */
export default function Lightbox({
  images,
  index,
  alt,
  onIndex,
  onClose,
}: {
  images: string[];
  /** Picture shown, or null when closed. */
  index: number | null;
  alt: (i: number) => string;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const open = index !== null && images.length > 0;
  useFocusTrap(ref, open, onClose);

  const step = (dir: -1 | 1) =>
    index !== null && onIndex((index + dir + images.length) % images.length);
  const nav =
    "absolute top-1/2 -translate-y-1/2 rounded-full border border-border bg-void/80 px-3 py-2 text-xl text-gray-200 hover:border-accent hover:text-accent";

  // Rendered at the end of <body>: inside a section that moves (parallax), a "fixed"
  // popup would be placed relative to that section instead of the screen.
  const mounted = useMounted();
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={alt(index)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-void/95 p-4 focus-visible:outline-none md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.15 }}
          onClick={onClose}
        >
          {/* All pictures load when it opens and are stacked, so ‹ › switch instantly. */}
          <div className="relative h-full w-full" onClick={(e) => e.stopPropagation()}>
            {images.map((src, i) => (
              <Image
                key={`${src}-${i}`}
                src={src}
                alt={i === index ? alt(i) : ""}
                aria-hidden={i !== index}
                fill
                loading="eager"
                sizes="100vw"
                unoptimized={!isStorage(src)}
                className={`object-contain ${i === index ? "opacity-100" : "opacity-0"}`}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full border border-border bg-void/80 px-3 py-1.5 text-gray-200 hover:text-white"
          >
            ✕
          </button>
          {images.length > 1 && (
            <>
              <button
                aria-label="Previous screenshot"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                className={`${nav} left-3`}
              >
                ‹
              </button>
              <button
                aria-label="Next screenshot"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                className={`${nav} right-3`}
              >
                ›
              </button>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs text-gray-400">
                {index + 1} / {images.length}
              </p>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
