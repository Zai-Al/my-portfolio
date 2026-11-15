// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect, useRef, useState } from "react";
import {
  applySearch,
  emptySearch,
  isSearching,
  type SearchConfig,
  type SearchState,
} from "../_lib/search";

/**
 * The state of one list's search: open or closed, what was typed and picked, and the
 * matching items. Render it with <SearchToggle> and <SearchPanel>. Without a config the
 * list is returned unchanged and nothing is shown.
 */
export function useListSearch<T>(items: T[], config?: SearchConfig<T>) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<SearchState>(emptySearch);
  /** On the toggle's wrapper: lets "/" find the first search on the page. */
  const anchorRef = useRef<HTMLDivElement>(null);
  const enabled = !!config;

  const searching = !!config && isSearching(config, state);
  const filtered = config ? applySearch(items, config, state) : items;

  const clear = () => setState(emptySearch);
  const close = () => {
    clear();
    setOpen(false);
  };

  // "/" opens the first search on the page, unless typing somewhere or a popup is open.
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)))
        return;
      if (document.querySelector('[role="dialog"]')) return;
      const mine = anchorRef.current;
      if (!mine || document.querySelector("[data-admin-search]") !== mine) return;
      e.preventDefault();
      setOpen(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [enabled]);

  return {
    config,
    open,
    setOpen,
    state,
    setState,
    clear,
    close,
    anchorRef,
    /** True while the list is narrowed down. */
    searching,
    filtered,
    total: items.length,
  };
}

export type ListSearch<T> = ReturnType<typeof useListSearch<T>>;
