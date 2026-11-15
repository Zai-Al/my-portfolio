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

/** "15/11/2026", "15-11-2026" or "15.11.2026" → "2026-11-15"; null when it isn't a real date. */
function parseTyped(text: string): string | null {
  const m = text.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return null;
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(year, month - 1, day);
  return d.getDate() === day && d.getMonth() === month - 1 ? dayKey(d) : null;
}

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

/**
 * A date field in the site's own style, always day/month/year. Type a date (15/11/2026) or
 * pick one from the calendar (arrow keys move, Enter picks, Esc closes).
 * `value` is "yyyy-mm-dd" or "" (empty).
 */
export default function DatePicker({
  value,
  onChange,
  label,
  min,
  max,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  min?: string;
  max?: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState<string | null>(null); // text being typed, until it's applied
  const [focusDay, setFocusDay] = useState(() => (value ? fromKey(value) : new Date()));
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const popupId = useId();

  const today = dayKey(new Date());
  const outOfRange = (key: string) => (!!min && key < min) || (!!max && key > max);

  function openCalendar() {
    setFocusDay(value ? fromKey(value) : new Date());
    setOpen(true);
  }

  function pick(key: string) {
    if (outOfRange(key)) return;
    onChange(key);
    setTyped(null);
    setOpen(false);
  }

  function applyTyped() {
    if (typed === null) return;
    if (typed.trim() === "") onChange("");
    else {
      const key = parseTyped(typed);
      if (key && !outOfRange(key)) onChange(key);
    }
    setTyped(null); // an invalid date falls back to the last good value
  }

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
      Home: () => addDays(focusDay, -focusDay.getDay()),
      End: () => addDays(focusDay, 6 - focusDay.getDay()),
    };
    if (moves[e.key]) {
      e.preventDefault();
      setFocusDay(moves[e.key]());
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation(); // close the calendar only, not the search around it
      setOpen(false);
    }
  }

  const shown = typed ?? (value ? formatDate(fromKey(value)) : "");
  const focusKey = dayKey(focusDay);

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center rounded border border-border bg-void focus-within:border-accent/60">
        <input
          value={shown}
          onChange={(e) => setTyped(e.target.value)}
          onBlur={applyTyped}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyTyped();
            }
          }}
          placeholder="dd/mm/yyyy"
          aria-label={label}
          inputMode="numeric"
          className="w-[7.5rem] min-w-0 bg-transparent px-2 py-1 font-mono text-xs text-gray-200 outline-none placeholder:text-gray-600"
        />
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openCalendar())}
          aria-label={`${label}: open calendar`}
          aria-expanded={open}
          aria-controls={popupId}
          className={`px-2 py-1.5 hover:text-accent ${open ? "text-accent" : "text-gray-500"}`}
        >
          <FaCalendarAlt aria-hidden className="h-3 w-3" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id={popupId}
            role="dialog"
            aria-label={`${label}: choose a date`}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduceMotion ? 0 : 0.15 }}
            className="absolute left-0 top-full z-30 mt-1 w-64 rounded border border-border bg-panel p-3 shadow-xl shadow-black/40"
          >
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

            <div className="grid grid-cols-7 gap-0.5 text-center font-mono text-[10px] text-gray-500">
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
              className="grid grid-cols-7 gap-0.5"
            >
              {monthGrid(focusDay).map((d) => {
                const key = dayKey(d);
                const inMonth = d.getMonth() === focusDay.getMonth();
                const selected = key === value;
                const disabled = outOfRange(key);
                return (
                  <button
                    key={key}
                    type="button"
                    tabIndex={key === focusKey ? 0 : -1}
                    disabled={disabled}
                    onClick={() => pick(key)}
                    aria-label={formatDate(d)}
                    aria-pressed={selected}
                    className={`rounded py-1 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${
                      selected
                        ? "bg-accent/20 text-accent"
                        : inMonth
                          ? "text-gray-200 hover:bg-white/10"
                          : "text-gray-600 hover:bg-white/5"
                    } ${key === today && !selected ? "ring-1 ring-inset ring-accent/40" : ""} focus:outline-none focus-visible:ring-1 focus-visible:ring-accent`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex justify-between border-t border-border pt-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => pick(today)}
                disabled={outOfRange(today)}
                className="text-accent hover:underline disabled:opacity-30"
              >
                today
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-gray-400 hover:text-gray-200 hover:underline"
              >
                clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
