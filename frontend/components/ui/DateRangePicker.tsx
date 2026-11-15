// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { dayKey, formatDate } from "@/lib/format";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]; // weeks start on Sunday
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2026-11-15" → a local Date (no time-zone shift). */
const fromKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
};

/** The 6 weeks shown for a month, starting on the Sunday on or before the 1st. */
function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** "any date", "15/11/2026", or "01/11/2026 – 15/11/2026" */
function describe(from: string, to: string) {
  if (!from && !to) return "any date";
  if (from && to)
    return from === to
      ? formatDate(fromKey(from))
      : `${formatDate(fromKey(from))} – ${formatDate(fromKey(to))}`;
  return from ? `from ${formatDate(fromKey(from))}` : `until ${formatDate(fromKey(to))}`;
}

/**
 * A compact date-range button in the site's style. Opens one calendar: click a start day, then
 * an end day (click the same day twice for a single day), or use a quick pick. Always shows
 * day/month/year. Arrow keys move, Enter picks, Esc closes. Dates are "yyyy-mm-dd" or "".
 */
export default function DateRangePicker({
  from,
  to,
  onChange,
  label,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<string | null>(null); // first day clicked, waiting for the second
  const [hover, setHover] = useState<string | null>(null);
  const [focusDay, setFocusDay] = useState(() => (to ? fromKey(to) : new Date()));
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const popupId = useId();

  const todayDate = new Date();
  const today = dayKey(todayDate);
  const active = !!from || !!to;

  function openCalendar() {
    setFocusDay(to ? fromKey(to) : from ? fromKey(from) : new Date());
    setAnchor(null);
    setOpen(true);
  }

  function apply(a: string, b: string) {
    onChange(a <= b ? a : b, a <= b ? b : a);
    setAnchor(null);
    setOpen(false);
  }

  function pick(key: string) {
    if (anchor === null) setAnchor(key);
    else apply(anchor, key);
  }

  const presets: { label: string; range: () => [string, string] }[] = [
    { label: "today", range: () => [today, today] },
    { label: "last 7 days", range: () => [dayKey(addDays(todayDate, -6)), today] },
    { label: "last 30 days", range: () => [dayKey(addDays(todayDate, -29)), today] },
    {
      label: "this month",
      range: () => [dayKey(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)), today],
    },
  ];

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep keyboard focus on the highlighted day while the calendar is open.
  useEffect(() => {
    if (open) gridRef.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus();
  }, [open, focusDay]);

  function onGridKey(e: React.KeyboardEvent) {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focusDay, -1),
      ArrowRight: () => addDays(focusDay, 1),
      ArrowUp: () => addDays(focusDay, -7),
      ArrowDown: () => addDays(focusDay, 7),
      PageUp: () => addMonths(focusDay, -1),
      PageDown: () => addMonths(focusDay, 1),
    };
    if (moves[e.key]) {
      e.preventDefault();
      const next = moves[e.key]();
      setFocusDay(next);
      if (anchor) setHover(dayKey(next));
    }
  }

  // The range drawn on the calendar: the saved one, or the one being picked.
  const [lo, hi] = (() => {
    if (anchor) {
      const end = hover ?? anchor;
      return anchor <= end ? [anchor, end] : [end, anchor];
    }
    return [from, to];
  })();
  const focusKey = dayKey(focusDay);

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.preventDefault();
          e.stopPropagation(); // close the calendar only, not the search around it
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openCalendar())}
        aria-label={`${label}: ${describe(from, to)}`}
        aria-expanded={open}
        aria-controls={popupId}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded border px-2.5 py-1 font-mono text-xs transition-colors ${
          active || open
            ? "border-accent/60 text-accent"
            : "border-border text-gray-400 hover:border-gray-500 hover:text-gray-200"
        }`}
      >
        <FaCalendarAlt aria-hidden className="h-3 w-3" />
        {describe(from, to)}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={popupId}
            role="dialog"
            aria-label={`${label}: choose dates`}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduceMotion ? 0 : 0.15 }}
            className="absolute right-0 top-full z-30 mt-1 w-72 rounded border border-border bg-panel p-3 shadow-xl shadow-black/40"
          >
            <div className="mb-3 flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => apply(...p.range())}
                  className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-gray-400 hover:border-accent/60 hover:text-accent"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setFocusDay(addMonths(focusDay, -1))}
                aria-label="Previous month"
                className="rounded p-1.5 text-gray-400 hover:bg-white/5 hover:text-accent"
              >
                <FaChevronLeft aria-hidden className="h-3 w-3" />
              </button>
              <p aria-live="polite" className="font-mono text-xs text-gray-200">
                {MONTHS[focusDay.getMonth()]} {focusDay.getFullYear()}
              </p>
              <button
                type="button"
                onClick={() => setFocusDay(addMonths(focusDay, 1))}
                aria-label="Next month"
                className="rounded p-1.5 text-gray-400 hover:bg-white/5 hover:text-accent"
              >
                <FaChevronRight aria-hidden className="h-3 w-3" />
              </button>
            </div>

            <div className="grid grid-cols-7 text-center font-mono text-[10px] text-gray-500">
              {WEEKDAYS.map((d) => (
                <span key={d} className="py-1">
                  {d}
                </span>
              ))}
            </div>
            <div
              ref={gridRef}
              role="grid"
              onKeyDown={onGridKey}
              onMouseLeave={() => setHover(null)}
              className="grid grid-cols-7 gap-y-0.5"
            >
              {monthGrid(focusDay).map((d) => {
                const key = dayKey(d);
                const inMonth = d.getMonth() === focusDay.getMonth();
                const isEnd = key === lo || key === hi;
                const inRange = !!lo && !!hi && key > lo && key < hi;
                return (
                  <button
                    key={key}
                    type="button"
                    tabIndex={key === focusKey ? 0 : -1}
                    onClick={() => pick(key)}
                    onMouseEnter={() => anchor && setHover(key)}
                    aria-label={formatDate(d)}
                    aria-pressed={isEnd || inRange}
                    className={`py-1 font-mono text-xs transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                      isEnd
                        ? "rounded bg-accent/25 text-accent"
                        : inRange
                          ? "bg-accent/10 text-gray-100"
                          : inMonth
                            ? "rounded text-gray-200 hover:bg-white/10"
                            : "rounded text-gray-600 hover:bg-white/5"
                    } ${key === today && !isEnd ? "ring-1 ring-inset ring-accent/40" : ""}`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-border pt-2 font-mono text-[11px]">
              <span className="text-gray-500">
                {anchor ? "now pick the end day" : "pick a start day, then an end day"}
              </span>
              <button
                type="button"
                onClick={() => {
                  onChange("", "");
                  setAnchor(null);
                  setOpen(false);
                }}
                className="text-gray-400 hover:text-gray-200 hover:underline"
              >
                any date
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
