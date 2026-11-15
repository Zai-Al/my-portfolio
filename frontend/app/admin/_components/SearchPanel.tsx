// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FaSearch } from "react-icons/fa";
import DatePicker from "@/components/ui/DatePicker";
import type { ListSearch } from "../_hooks/useListSearch";
import { chipValue } from "../_lib/search";

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
    active
      ? "border-accent bg-accent/10 text-accent"
      : "border-border text-gray-400 hover:border-gray-500 hover:text-gray-200"
  }`;

/** The "search" button for a section header. Opens and closes the panel. */
export function SearchToggle<T>({ search }: { search: ListSearch<T> }) {
  const { config, open, searching, anchorRef } = search;
  if (!config) return null;
  return (
    <div ref={anchorRef} data-admin-search>
      <button
        onClick={() => (open ? search.close() : search.setOpen(true))}
        aria-expanded={open}
        aria-label={open ? `Close the ${config.label} search` : `Search ${config.label}`}
        title={open ? "Close search (Esc)" : "Search (/)"}
        className={`flex items-center gap-1.5 rounded border px-3 py-1 font-mono text-xs transition-colors ${
          open || searching
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

/** The search boxes, chips and dates, shown under the header while open. */
export function SearchPanel<T>({ search }: { search: ListSearch<T> }) {
  const { config, open, state, setState, filtered, total } = search;
  const reduceMotion = useReducedMotion();
  const firstBox = useRef<HTMLInputElement>(null);
  // Clipped while sliding open/closed, visible once open (so the calendar popup isn't cut off).
  const [settled, setSettled] = useState(false);

  // Focus the first box when the panel opens.
  useEffect(() => {
    if (open) firstBox.current?.focus();
  }, [open]);

  if (!config) return null;
  const single = config.fields.length === 1;
  const hasInput =
    Object.values(state.text).some((v) => v.trim()) ||
    Object.keys(state.chips).length > 0 ||
    !!state.from ||
    !!state.to;

  const setText = (key: string, v: string) =>
    setState((s) => ({ ...s, text: { ...s.text, [key]: v } }));
  const onEsc = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      search.close();
    }
  };

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
            onKeyDown={onEsc}
            className="mt-3 space-y-3 rounded border border-border bg-panel/40 p-3"
          >
            {/* Text boxes: one for most lists, one per field for the inbox. */}
            <div className={single ? "flex items-center gap-2" : "grid gap-2 sm:grid-cols-3"}>
              {config.fields.map((f, i) => (
                <label
                  key={f.key}
                  className={single ? "flex min-w-0 flex-1 items-center gap-2" : "block"}
                >
                  {single ? (
                    <FaSearch aria-hidden className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                  ) : (
                    <span className="mb-1 block font-mono text-xs text-gray-500">{f.label}</span>
                  )}
                  <input
                    ref={i === 0 ? firstBox : undefined}
                    type="text"
                    value={state.text[f.key] ?? ""}
                    onChange={(e) => setText(f.key, e.target.value)}
                    placeholder={
                      single ? `search by ${f.label.toLowerCase()}...` : "type to search..."
                    }
                    aria-label={
                      single ? `Search ${config.label} by ${f.label.toLowerCase()}` : f.label
                    }
                    className={
                      single
                        ? "min-w-0 flex-1 bg-transparent font-mono text-sm text-gray-200 outline-none placeholder:text-gray-600"
                        : "w-full rounded border border-border bg-void px-2 py-1 font-mono text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-accent/60"
                    }
                  />
                </label>
              ))}
              {single && (
                <Summary
                  shown={filtered.length}
                  total={total}
                  canClear={hasInput}
                  onClear={search.clear}
                />
              )}
            </div>

            {config.chips?.map((c) => (
              <div
                key={c.key}
                role="group"
                aria-label={c.label}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="font-mono text-xs text-gray-500">{c.label}:</span>
                {c.options.map((o) => (
                  <button
                    key={o.value}
                    onClick={() =>
                      setState((s) => ({ ...s, chips: { ...s.chips, [c.key]: o.value } }))
                    }
                    aria-pressed={chipValue(c, state) === o.value}
                    className={chip(chipValue(c, state) === o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            ))}

            {config.dateRange && (
              <div
                role="group"
                aria-label={config.dateRange.label}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="font-mono text-xs text-gray-500">{config.dateRange.label}:</span>
                <span className="font-mono text-xs text-gray-500">from</span>
                <DatePicker
                  label={`${config.dateRange.label} from`}
                  value={state.from}
                  max={state.to || undefined}
                  onChange={(from) => setState((s) => ({ ...s, from }))}
                />
                <span className="font-mono text-xs text-gray-500">to</span>
                <DatePicker
                  label={`${config.dateRange.label} to`}
                  value={state.to}
                  min={state.from || undefined}
                  onChange={(to) => setState((s) => ({ ...s, to }))}
                />
              </div>
            )}

            {!single && (
              <div className="flex justify-end">
                <Summary
                  shown={filtered.length}
                  total={total}
                  canClear={hasInput}
                  onClear={search.clear}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** "3 of 12" and the clear button. */
function Summary({
  shown,
  total,
  canClear,
  onClear,
}: {
  shown: number;
  total: number;
  canClear: boolean;
  onClear: () => void;
}) {
  return (
    <span className="flex shrink-0 items-center gap-3 font-mono text-xs">
      <span aria-live="polite" className="text-gray-500">
        {shown} of {total}
      </span>
      <button
        onClick={onClear}
        disabled={!canClear}
        className="rounded border border-border px-2 py-0.5 text-gray-300 hover:bg-white/5 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
      >
        clear
      </button>
    </span>
  );
}
