// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// How the admin lists are searched. Pure functions (no React): the per-page settings live in
// searchConfig.ts, the state in useListSearch, the look in SearchPanel. Searching happens in
// the browser on the lists the admin has already loaded, so it's instant and needs no API.

import { dayKey } from "@/lib/format";

/** Something the search box can look in. With several, a "by …" dropdown picks one. */
export type SearchField<T> = {
  key: string;
  label: string;
  text: (item: T) => string | null | undefined;
};

/** A row of filter chips shown above the list. The first option is the default ("All"). */
export type ChipFilter<T> = {
  key: string;
  options: { value: string; label: string }[];
  /** Keeps an item for a chosen (non-default) value. Leave out for chips that don't filter
   *  (e.g. a sort order the page applies itself); those show no counts. */
  test?: (item: T, value: string) => boolean;
};

export type SearchConfig<T> = {
  /** What is being searched, for labels: "skills", "messages"… */
  label: string;
  fields: SearchField<T>[];
  chips?: ChipFilter<T>[];
  /** Adds a date-range button to the search bar, matched against this date. */
  date?: (item: T) => string;
};

/** What the person has entered. Dates are "yyyy-mm-dd" or "". */
export type SearchState = {
  query: string;
  /** Key of the field being searched ("" = the first). */
  field: string;
  chips: Record<string, string>;
  from: string;
  to: string;
};

export const emptySearch: SearchState = { query: "", field: "", chips: {}, from: "", to: "" };

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

export const selectedField = <T>(config: SearchConfig<T>, state: SearchState) =>
  config.fields.find((f) => f.key === state.field) ?? config.fields[0];

export const chipValue = <T>(chip: ChipFilter<T>, state: SearchState) =>
  state.chips[chip.key] ?? chip.options[0]?.value ?? "";

const isDefault = <T>(chip: ChipFilter<T>, value: string) =>
  value === (chip.options[0]?.value ?? "");

/** How many items a chip option would show (the default option counts everything). */
export const chipCount = <T>(items: T[], chip: ChipFilter<T>, value: string) =>
  isDefault(chip, value) || !chip.test
    ? items.length
    : items.filter((i) => chip.test!(i, value)).length;

/** True when the search bar has something in it (text or dates). */
export const hasSearchInput = (state: SearchState) =>
  !!state.query.trim() || !!state.from || !!state.to;

/** True while the list is narrowed down by the bar or a chip (reordering is then turned off). */
export function isSearching<T>(config: SearchConfig<T>, state: SearchState): boolean {
  return (
    words(state.query).length > 0 ||
    (config.chips ?? []).some((c) => c.test && !isDefault(c, chipValue(c, state))) ||
    (!!config.date && (!!state.from || !!state.to))
  );
}

/** The items that match the search bar, every chip and the date range. */
export function applySearch<T>(items: T[], config: SearchConfig<T>, state: SearchState): T[] {
  const field = selectedField(config, state);
  return items.filter((item) => {
    if (field && !matchesWords(field.text(item), state.query)) return false;
    for (const c of config.chips ?? []) {
      const value = chipValue(c, state);
      if (c.test && !isDefault(c, value) && !c.test(item, value)) return false;
    }
    if (config.date && (state.from || state.to)) {
      const day = dayKey(config.date(item));
      if (state.from && day < state.from) return false;
      if (state.to && day > state.to) return false;
    }
    return true;
  });
}
