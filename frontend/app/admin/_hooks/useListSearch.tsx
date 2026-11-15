// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FaSearch, FaTimes } from "react-icons/fa";

/** One row of chips under the search box. The first option is the default ("all"). */
export type SearchFilter<T> = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  /** Keeps an item when the chosen (non-default) value applies to it. Leave out for options
   *  that don't filter, e.g. a sort order the caller applies itself. */
  test?: (item: T, value: string) => boolean;
};

export type SearchConfig<T> = {
  /** What is searched, for the placeholder and labels, e.g. "experience". */
  label: string;
  /** The text fields searched for each item (lists and empty values are fine). */
  text: (item: T) => unknown[];
  filters?: SearchFilter<T>[];
};

const haystack = (values: unknown[]) =>
  values
    .flat(2)
    .filter((v) => v !== null && v !== undefined && v !== "")
    .map(String)
    .join(" ")
    .toLowerCase();

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
    active
      ? "border-accent bg-accent/10 text-accent"
      : "border-border text-gray-400 hover:border-gray-500 hover:text-gray-200"
  }`;

/**
 * Live search for an admin list: a 🔍 button that opens a search box (+ filter chips),
 * filtering as you type. Every word typed must appear somewhere in the item's text.
 * Esc clears and closes it; "/" opens the first search on the page.
 * Returns the `toggle` (for the section header), the `panel`, and the filtered items.
 * Without a config it does nothing and returns the items unchanged.
 */
export function useListSearch<T>(items: T[], config?: SearchConfig<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelId = useId();
  const reduceMotion = useReducedMotion();
  const enabled = !!config;

  const filters = config?.filters ?? [];
  const defaultOf = (f: SearchFilter<T>) => f.options[0]?.value ?? "";
  const valueOf = (f: SearchFilter<T>) => values[f.key] ?? defaultOf(f);

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtering = filters.some((f) => f.test && valueOf(f) !== defaultOf(f));
  /** True while the list is narrowed down (the caller then disables reordering). */
  const active = enabled && (words.length > 0 || filtering);

  const filtered = !config
    ? items
    : items.filter((item) => {
        if (words.length) {
          const text = haystack(config.text(item));
          if (!words.every((w) => text.includes(w))) return false;
        }
        return filters.every(
          (f) => !f.test || valueOf(f) === defaultOf(f) || f.test(item, valueOf(f))
        );
      });

  function close() {
    setQuery("");
    setValues({});
    setOpen(false);
  }

  // Focus the box when it opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // "/" opens the first search on the page, unless typing somewhere or a popup is open.
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)))
        return;
      if (document.querySelector('[role="dialog"]')) return;
      const mine = wrapperRef.current;
      if (!mine || document.querySelector("[data-admin-search]") !== mine) return;
      e.preventDefault();
      setOpen(true);
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [enabled]);

  const toggle = enabled ? (
    <div ref={wrapperRef} data-admin-search>
      <button
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? `Close the ${config.label} search` : `Search ${config.label}`}
        title={open ? "Close search (Esc)" : "Search (/)"}
        className={`flex items-center gap-1.5 rounded border px-3 py-1 font-mono text-xs transition-colors ${
          open || active
            ? "border-accent bg-accent/10 text-accent"
            : "border-border text-gray-400 hover:border-gray-500 hover:text-gray-200"
        }`}
      >
        <FaSearch aria-hidden className="h-3 w-3" />
        search
      </button>
    </div>
  ) : null;

  const panel = enabled ? (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          id={panelId}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
          className="overflow-hidden"
        >
          <div className="mt-3 space-y-3 rounded border border-border bg-panel/40 p-3">
            <div className="flex items-center gap-2">
              <FaSearch aria-hidden className="h-3.5 w-3.5 shrink-0 text-gray-500" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    close();
                  }
                }}
                placeholder={`search ${config.label}...`}
                aria-label={`Search ${config.label}`}
                className="min-w-0 flex-1 bg-transparent font-mono text-sm text-gray-200 outline-none placeholder:text-gray-600"
              />
              <span aria-live="polite" className="shrink-0 font-mono text-xs text-gray-500">
                {filtered.length} of {items.length}
              </span>
              <button
                onClick={close}
                aria-label="Clear and close the search"
                title="Clear and close (Esc)"
                className="shrink-0 rounded p-1 text-gray-500 hover:bg-white/5 hover:text-gray-200"
              >
                <FaTimes aria-hidden className="h-3.5 w-3.5" />
              </button>
            </div>
            {filters.map((f) => (
              <div
                key={f.key}
                role="group"
                aria-label={f.label}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="font-mono text-xs text-gray-500">{f.label}:</span>
                {f.options.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setValues((v) => ({ ...v, [f.key]: o.value }))}
                    aria-pressed={valueOf(f) === o.value}
                    className={chip(valueOf(f) === o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  ) : null;

  return { toggle, panel, filtered, active, values };
}
