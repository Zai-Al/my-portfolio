// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// How the admin lists are searched. Pure functions (no React): the per-page settings live in
// searchConfig.ts, the state in useListSearch, the look in SearchPanel. Searching happens in
// the browser on the lists the admin has already loaded, so it's instant and needs no API.

import { dayKey } from "@/lib/format";

/** A text box. With one field the panel shows a single box; with several, one labelled box each. */
export type SearchField<T> = {
  key: string;
  label: string;
  text: (item: T) => string | null | undefined;
};

/** A row of chips. The first option is the default ("all"). */
export type ChipFilter<T> = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  /** Keeps an item for a chosen (non-default) value. Leave out for chips that don't filter
   *  (e.g. a sort order the page applies itself). */
  test?: (item: T, value: string) => boolean;
};

/** "From … to …" date pickers, matched against the item's day. */
export type DateRangeFilter<T> = {
  label: string;
  date: (item: T) => string;
};

export type SearchConfig<T> = {
  /** What is being searched, for labels: "skills", "messages"… */
  label: string;
  fields: SearchField<T>[];
  chips?: ChipFilter<T>[];
  dateRange?: DateRangeFilter<T>;
};

/** What the person has entered. Dates are "yyyy-mm-dd" or "". */
export type SearchState = {
  text: Record<string, string>;
  chips: Record<string, string>;
  from: string;
  to: string;
};

export const emptySearch: SearchState = { text: {}, chips: {}, from: "", to: "" };

// Words are split on spaces and punctuation, except # and + (so "C#" and "C++" stay words).
const SEPARATORS = /[\s.,/\\()[\]{}\-–—_&|:;!?"'`*~<>=@]+/;

export const words = (text: string | null | undefined) =>
  (text ?? "").toLowerCase().split(SEPARATORS).filter(Boolean);

/**
 * True when every word typed starts a word in the text: "n" finds ".NET" and "Next.js" but not
 * "Python"; ".net" finds "ASP.NET Core"; "asp core" finds it too. An empty query matches everything.
 */
export function matchesWords(text: string | null | undefined, query: string): boolean {
  const wanted = words(query);
  if (wanted.length === 0) return true;
  const have = words(text);
  return wanted.every((w) => have.some((h) => h.startsWith(w)));
}

export const chipValue = <T>(chip: ChipFilter<T>, state: SearchState) =>
  state.chips[chip.key] ?? chip.options[0]?.value ?? "";

const isDefault = <T>(chip: ChipFilter<T>, state: SearchState) =>
  chipValue(chip, state) === (chip.options[0]?.value ?? "");

/** True while the search narrows the list (reordering is then turned off). */
export function isSearching<T>(config: SearchConfig<T>, state: SearchState): boolean {
  return (
    config.fields.some((f) => words(state.text[f.key]).length > 0) ||
    (config.chips ?? []).some((c) => c.test && !isDefault(c, state)) ||
    (!!config.dateRange && (!!state.from || !!state.to))
  );
}

/** The items that match every box, chip and date entered. */
export function applySearch<T>(items: T[], config: SearchConfig<T>, state: SearchState): T[] {
  return items.filter((item) => {
    for (const f of config.fields) {
      if (!matchesWords(f.text(item), state.text[f.key] ?? "")) return false;
    }
    for (const c of config.chips ?? []) {
      if (c.test && !isDefault(c, state) && !c.test(item, chipValue(c, state))) return false;
    }
    if (config.dateRange && (state.from || state.to)) {
      const day = dayKey(config.dateRange.date(item));
      if (state.from && day < state.from) return false;
      if (state.to && day > state.to) return false;
    }
    return true;
  });
}
