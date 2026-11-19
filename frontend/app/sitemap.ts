// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { localePath } from "@/i18n/routing";

// The public pages, each in English and Arabic (with hreflang links between the two).
// /admin is left out on purpose.
const PAGES = [
  { path: "/", changeFrequency: "monthly", priority: 1 },
  { path: "/playground", changeFrequency: "yearly", priority: 0.5 },
] as const;

const url = (locale: string, path: string) =>
  `${SITE_URL}${localePath(locale, path)}`.replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap(({ path, changeFrequency, priority }) =>
    ["en", "ar"].map((locale) => ({
      url: url(locale, path),
      changeFrequency,
      priority,
      alternates: { languages: { en: url("en", path), ar: url("ar", path) } },
    }))
  );
}
