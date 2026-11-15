// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FaChevronDown, FaSearch } from "react-icons/fa";
import DateRangePicker from "@/components/ui/DateRangePicker";
import type { ListSearch } from "../_hooks/useListSearch";
import { chipCount, chipValue, hasSearchInput, selectedField } from "../_lib/search";

/** The same chip style as the Skills category filter. */
export const chipClass = (active: boolean) =>
  `rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
    active
      ? "border-accent bg-accent/10 text-accent"
      : "border-border text-gray-400 hover:border-gray-500 hover:text-gray-200"
  }`;

/** The "search" button for a section header. Opens and closes the search bar. */
export function SearchToggle<T>({ search }: { search: ListSearch<T> }) {
  const { config, open, anchorRef } = search;
  if (!config) return null;
  const filled = hasSearchInput(search.state);
  return (
    <div ref={anchorRef} data-admin-search>
      <button
        onClick={() => (open ? search.close() : search.setOpen(true))}
        aria-expanded={open}
        aria-label={open ? `Close the ${config.label} search` : `Search ${config.label}`}
        title={open ? "Close search (Esc)" : "Search (/)"}
        className={`flex items-center gap-1.5 rounded border px-3 py-1 font-mono text-xs transition-colors ${
          open || filled
            ? "border-accent bg-accent/10 text-accent"
            : "border-border text-gray-400 hover:border-gray-500 hover:text-gray-200"
        }`}
      >
        <FaSearch aria-hidden className="h-3 w-3" />
        search
      </button>
    </div>
  );
}

/** Filter chips above the list (always visible), with counts, like the Skills filter. */
export function FilterChips<T>({
  search,
  className = "mt-3",
}: {
  search: ListSearch<T>;
  className?: string;
}) {
  const { config, state, setState, items } = search;
  const groups = config?.chips ?? [];
  if (!config || groups.length === 0 || items.length === 0) return null;
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {groups.map((c, gi) => (
        <div
          key={c.key}
          role="group"
          aria-label={`Filter ${config.label}`}
          className={`flex flex-wrap gap-2 ${gi > 0 ? "border-l border-border pl-2" : ""}`}
        >
          {c.options.map((o) => {
            const on = chipValue(c, state) === o.value;
            return (
              <button
                key={o.value}
                onClick={() => setState((s) => ({ ...s, chips: { ...s.chips, [c.key]: o.value } }))}
                aria-pressed={on}
                className={chipClass(on)}
              >
                {o.label}
                {c.test && ` (${chipCount(items, c, o.value)})`}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** The search bar, shown under the header while open: [by … ▾] [search…] [📅 dates] 3 of 12 [clear] */
export function SearchPanel<T>({ search }: { search: ListSearch<T> }) {
  const { config, open, state, setState, filtered, total } = search;
  const reduceMotion = useReducedMotion();
  const box = useRef<HTMLInputElement>(null);
  // Clipped while sliding open/closed, visible once open (so the calendar popup isn't cut off).
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (open) box.current?.focus();
  }, [open]);

  if (!config) return null;
  const field = selectedField(config, state);

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
          style={{ overflow: settled ? "visible" : "hidden" }}
          onAnimationStart={() => setSettled(false)}
          onAnimationComplete={() => setSettled(open)}
        >
          <div
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                search.close();
              }
            }}
            className="mt-3 flex flex-wrap items-center gap-2 rounded border border-border bg-panel/40 p-2"
          >
            {config.fields.length > 1 && (
              <label className="relative">
                <span className="sr-only">Search by</span>
                <select
                  value={field.key}
                  onChange={(e) => {
                    setState((s) => ({ ...s, field: e.target.value }));
                    box.current?.focus();
                  }}
                  className="appearance-none rounded border border-border bg-void py-1 pl-2.5 pr-7 font-mono text-xs text-gray-300 outline-none [color-scheme:dark] hover:border-gray-500 focus:border-accent/60"
                >
                  {config.fields.map((f) => (
                    <option key={f.key} value={f.key}>
                      by {f.label}
                    </option>
                  ))}
                </select>
                <FaChevronDown
                  aria-hidden
                  className="pointer-events-none absolute right-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-gray-500"
                />
              </label>
            )}

            <label className="flex min-w-[10rem] flex-1 items-center gap-2 px-1">
              <FaSearch aria-hidden className="h-3.5 w-3.5 shrink-0 text-gray-500" />
              <input
                ref={box}
                type="text"
                value={state.query}
                onChange={(e) => setState((s) => ({ ...s, query: e.target.value }))}
                placeholder={`search by ${field.label}...`}
                aria-label={`Search ${config.label} by ${field.label}`}
                className="min-w-0 flex-1 bg-transparent font-mono text-sm text-gray-200 outline-none placeholder:text-gray-600"
              />
            </label>

            {config.date && (
              <DateRangePicker
                label="Received"
                from={state.from}
                to={state.to}
                onChange={(from, to) => setState((s) => ({ ...s, from, to }))}
              />
            )}

            <span className="flex shrink-0 items-center gap-3 pl-1 font-mono text-xs">
              <span aria-live="polite" className="text-gray-500">
                {filtered.length} of {total}
              </span>
              <button
                onClick={search.clear}
                disabled={!hasSearchInput(state)}
                className="rounded border border-border px-2 py-0.5 text-gray-300 hover:bg-white/5 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
              >
                clear
              </button>
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
