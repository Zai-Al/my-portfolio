// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// "Translate to Arabic" in the admin forms: which English texts to send, and how the
// answer goes back into the form (the "...Ar" twin of each field).

import type { FieldConfig } from "./fields";

const filled = (value: unknown) =>
  Array.isArray(value) ? value.length > 0 : typeof value === "string" && value.trim() !== "";

/**
 * The English texts whose Arabic box is still empty, by English field name
 * ({ role: "Intern" } for an empty roleAr). Arabic you've already typed is never overwritten.
 */
export function textsToTranslate<T>(
  fields: FieldConfig<T>[],
  values: Partial<T>
): Record<string, string | string[]> {
  const record = values as Record<string, unknown>;
  const out: Record<string, string | string[]> = {};
  for (const f of fields) {
    const key = f.key as string;
    if (!f.arabic || !key.endsWith("Ar")) continue;
    const base = key.slice(0, -2);
    const english = record[base];
    if (!filled(record[key]) && filled(english)) out[base] = english as string | string[];
  }
  return out;
}

/** The translations as form values: { role: "…" } → { roleAr: "…" }. */
export const asArabicFields = (translated: Record<string, string | string[]>) =>
  Object.fromEntries(Object.entries(translated).map(([base, value]) => [`${base}Ar`, value]));
