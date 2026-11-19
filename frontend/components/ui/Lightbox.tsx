// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useRef } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { useMounted } from "@/lib/useMounted";

const isStorage = (url: string) => url.includes("/storage/v1/object/public/portfolio-media/");

/**
 * One picture as large as the screen allows. Esc, ✕ or a click outside the picture close
 * it (only it, not the popup underneath); ‹ › or a swipe flip through the set. On phones
 * ‹ › sit in a bar under the picture so they never cover it; from md up they sit at the sides.
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
  const touchX = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const t = useTranslations("lightbox");
  // Right to left (Arabic): "previous" sits on the right and a swipe to the right goes forward.
  const rtl = useLocale() === "ar";
  const open = index !== null && images.length > 0;
  useFocusTrap(ref, open, onClose);

  const step = (dir: -1 | 1) =>
    index !== null && onIndex((index + dir + images.length) % images.length);
  const navButton =
    "rounded-full border border-border bg-void/80 text-xl text-gray-200 hover:border-accent hover:text-accent";
  const sideNav = `${navButton} absolute top-1/2 hidden -translate-y-1/2 px-3 py-2 md:block`;
  const barNav = `${navButton} flex h-11 w-11 items-center justify-center`;
  const multiple = images.length > 1;

  // A horizontal swipe of 50px or more flips the picture (phones and tablets).
  const onTouchStart = (e: React.TouchEvent) => (touchX.current = e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null || !multiple) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) >= 50) step(dx < 0 !== rtl ? 1 : -1);
  };
  const stepButton = (dir: -1 | 1, className: string) => (
    <button
      aria-label={dir < 0 ? t("previous") : t("next")}
      onClick={(e) => {
        e.stopPropagation();
        step(dir);
      }}
      className={className}
    >
      {dir < 0 !== rtl ? "‹" : "›"}
    </button>
  );

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
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-3 bg-void/95 px-4 pb-4 pt-16 focus-visible:outline-none md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.15 }}
          onClick={onClose}
        >
          {/* All pictures load when it opens and are stacked, so ‹ › switch instantly. */}
          <div
            className="relative min-h-0 w-full flex-1"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
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
            aria-label={t("close")}
            className="absolute end-4 top-4 rounded-full border border-border bg-void/80 px-3 py-1.5 text-gray-200 hover:text-white"
          >
            ✕
          </button>
          {multiple && (
            <>
              {stepButton(-1, `${sideNav} start-3`)}
              {stepButton(1, `${sideNav} end-3`)}
              <p className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 font-mono text-xs text-gray-400 md:block">
                {index + 1} / {images.length}
              </p>
              {/* Phones: controls in their own row under the picture. */}
              <div
                className="flex shrink-0 items-center gap-6 md:hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {stepButton(-1, barNav)}
                <p className="font-mono text-xs text-gray-400">
                  {index + 1} / {images.length}
                </p>
                {stepButton(1, barNav)}
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
