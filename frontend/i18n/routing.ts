// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { defineRouting } from "next-intl/routing";

/**
 * The site's languages. English lives at "/" (no prefix, so existing links keep working),
 * Arabic at "/ar". The visitor picks with the language switch; the browser's language is
 * not used to redirect, so a shared link always opens in the language it was shared in.
 */
export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

/** Right-to-left languages. */
export const isRtl = (locale: string) => locale === "ar";

/**
 * A site path in the given language: localePath("ar", "/playground") → "/ar/playground",
 * localePath("en", "/") → "/". A "#hash" or "?query" on the path is kept.
 */
export function localePath(locale: string, path: string): string {
  if (locale === routing.defaultLocale) return path;
  const [, pathname = "/", rest = ""] = path.match(/^([^?#]*)(.*)$/) ?? [];
  return `/${locale}${pathname === "/" ? "" : pathname}${rest}`;
}
