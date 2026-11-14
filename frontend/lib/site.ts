// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import type { Guide, SiteSettings, SkillCategory } from "@/lib/types";

/**
 * The site's public address, for link previews, the sitemap and robots.txt.
 * NEXT_PUBLIC_SITE_URL wins (e.g. a custom domain later); on Vercel the production
 * domain is filled in automatically; locally it's localhost.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/+$/, "");

/** First sentence of the bio, shortened to fit a search result (about 160 characters). */
export function shortBio(settings: SiteSettings, max = 160): string {
  const bio = (settings.bio ?? "").trim();
  if (!bio) return settings.headline ?? "Portfolio";
  const first = bio.match(/^.*?[.!?](\s|$)/)?.[0]?.trim() ?? bio;
  return first.length <= max ? first : `${first.slice(0, max - 1).trimEnd()}…`;
}

/** Terminal `whoami`: name, headline, first line of the bio, where and how I work. */
export function whoamiText(s: SiteSettings): string {
  const lines = [
    [s.fullName, s.headline].filter(Boolean).join(" — "),
    s.bio ? shortBio(s, 220) : null,
    [s.location, s.availability].filter(Boolean).join(" · ") || null,
  ].filter(Boolean);
  return lines.length ? lines.join("\n") : "Still loading my profile. Try again in a moment.";
}

/** Terminal `skills`: each category with its first few skills, in display order. */
export function skillsText(categories: SkillCategory[], perCategory = 6): string {
  const lines = categories
    .filter((c) => c.skills?.length)
    .map((c) => {
      const names = c.skills.slice(0, perCategory).map((sk) => sk.name);
      const more = c.skills.length > perCategory ? `, +${c.skills.length - perCategory} more` : "";
      return `${c.name}: ${names.join(", ")}${more}`;
    });
  return lines.length
    ? `${lines.join("\n")}\n\nHover the tiles in the Skills section for details.`
    : "See the Skills section for what I work with.";
}

/**
 * Structured data (schema.org Person) for search engines, from SiteSettings.
 * Rendered as JSON inside <script type="application/ld+json">; "<" is escaped so the
 * text can never close the script tag.
 */
export function personJsonLd(s: SiteSettings): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: s.fullName || undefined,
    jobTitle: s.headline || undefined,
    description: s.bio ? shortBio(s, 300) : undefined,
    url: SITE_URL,
    email: s.email ? `mailto:${s.email}` : undefined,
    address: s.location ? { "@type": "PostalAddress", addressCountry: s.location } : undefined,
    knowsLanguage: s.spokenLanguages.length
      ? s.spokenLanguages.map((l) => l.replace(/\s*\(.*\)\s*$/, ""))
      : undefined,
    sameAs: [s.githubUrl, s.linkedInUrl].filter(Boolean),
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Chat widget starter questions: the first few guide titles, in admin order (so
 * reordering guides in the admin portal changes them). Long titles are skipped.
 */
export function starterQuestions(guides: Guide[], count = 4): string[] {
  return guides
    .map((g) => g.title.trim())
    .filter((t) => t && t.length <= 60)
    .slice(0, count);
}
