// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// Site content comes from the database in English, with an optional Arabic copy of each text
// field next to it ("role" and "roleAr"). localize() hands the components the right one, so
// they never need to know which language is showing.

// Date fields are free text in the database ("Jun 2026", "September 2023", "2026-06").
const DATE_KEYS = new Set(["startDate", "endDate", "issueDate", "expiryDate"]);
const MONTHS_EN = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];
// The month names used in Bahrain and the Gulf; digits stay 0-9, as on most Gulf sites.
const MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

/**
 * "Jun 2026" / "June 2026" / "2026-06" / "06/2026" → "يونيو 2026". Anything else ("2026", "Present",
 * text already in Arabic) is returned unchanged.
 */
export function arabicDate(value: string): string {
  const text = value.trim();
  const named = text.match(/^([A-Za-z]{3,9})\.?,?\s+(\d{4})$/);
  if (named) {
    const month = MONTHS_EN.indexOf(named[1].slice(0, 3).toLowerCase());
    return month < 0 ? value : `${MONTHS_AR[month]} ${named[2]}`;
  }
  const iso = text.match(/^(\d{4})-(\d{1,2})$/); // 2026-06
  const slash = text.match(/^(\d{1,2})\/(\d{4})$/); // 06/2026
  const [year, month] = iso ? [iso[1], iso[2]] : slash ? [slash[2], slash[1]] : [];
  const index = Number(month) - 1;
  return year && index >= 0 && index < 12 ? `${MONTHS_AR[index]} ${year}` : value;
}

const filled = (value: unknown) =>
  Array.isArray(value) ? value.length > 0 : typeof value === "string" && value.trim() !== "";

/**
 * A copy of `value` (an object, a list, or nested ones like categories with skills) where, for
 * Arabic, every field that has a filled-in "...Ar" twin takes that twin's value. An empty
 * Arabic field keeps the English one, so a half-translated record still shows everything.
 * Month names in dates are turned into Arabic too.
 */
export function localize<T>(value: T, locale: string): T {
  if (locale !== "ar" || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => localize(item, locale)) as T;

  const source = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(source))
    out[key] =
      DATE_KEYS.has(key) && typeof field === "string" ? arabicDate(field) : localize(field, locale);
  for (const key of Object.keys(source)) {
    const base = key.endsWith("Ar") ? key.slice(0, -2) : null;
    if (base && base in source && filled(source[key])) out[base] = source[key];
  }
  return out as T;
}
