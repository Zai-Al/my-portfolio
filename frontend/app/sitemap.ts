// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/api/public";
import { SITE_URL, projectPath } from "@/lib/site";
import { localePath } from "@/i18n/routing";

// The public pages, each in English and Arabic (with hreflang links between the two):
// the fixed pages below plus one page per project, read from the API (cached with the
// content, so a new project appears here once the admin saves it). /admin is left out on purpose.
const PAGES = [
  { path: "/", changeFrequency: "monthly", priority: 1 },
  { path: "/playground", changeFrequency: "yearly", priority: 0.5 },
] as const;

const LOCALES = ["en", "ar"] as const;

const absolute = (path: string) => `${SITE_URL}${path}`.replace(/\/$/, "");

/** One entry per language for a page, each listing both languages. */
function entries(
  pathIn: (locale: string) => string,
  changeFrequency: "monthly" | "yearly",
  priority: number
): MetadataRoute.Sitemap {
  const languages = { en: absolute(pathIn("en")), ar: absolute(pathIn("ar")) };
  return LOCALES.map((locale) => ({
    url: absolute(pathIn(locale)),
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjects();
  return [
    ...PAGES.flatMap(({ path, changeFrequency, priority }) =>
      entries((locale) => localePath(locale, path), changeFrequency, priority)
    ),
    ...projects.flatMap((p) => entries((locale) => projectPath(locale, p.slug), "monthly", 0.8)),
  ];
}
