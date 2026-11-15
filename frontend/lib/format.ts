// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// Dates are always shown day/month/year (e.g. 15/11/2026), whatever the browser's language.

const pad = (n: number) => String(n).padStart(2, "0");

const toDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));

/** "15/11/2026" */
export function formatDate(value: Date | string): string {
  const d = toDate(value);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "15/11/2026, 02:40" */
export function formatDateTime(value: Date | string): string {
  const d = toDate(value);
  return `${formatDate(d)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** The local calendar day as "2026-11-15" (sorts and compares as text). */
export function dayKey(value: Date | string): string {
  const d = toDate(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
