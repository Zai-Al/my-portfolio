// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import type {
  Certification,
  Education,
  Experience,
  Guide,
  Project,
  SiteSettings,
  SkillCategory,
} from "@/lib/types";
import { localePath } from "@/i18n/routing";

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

/**
 * A file in this site's own source code on GitHub, e.g. sourceUrl("frontend/app/page.tsx"),
 * or null when unknown. Built from the repo details Vercel sets at build time, so no link is
 * written into the code; a local build has none and hides "view source" links.
 */
export function sourceUrl(
  path: string,
  env: Record<string, string | undefined> = process.env
): string | null {
  const { VERCEL_GIT_PROVIDER, VERCEL_GIT_REPO_OWNER, VERCEL_GIT_REPO_SLUG } = env;
  if (VERCEL_GIT_PROVIDER !== "github" || !VERCEL_GIT_REPO_OWNER || !VERCEL_GIT_REPO_SLUG)
    return null;
  const ref = env.VERCEL_GIT_COMMIT_REF || "main";
  const file = path.split("/").filter(Boolean).map(encodeURIComponent).join("/");
  return `https://github.com/${VERCEL_GIT_REPO_OWNER}/${VERCEL_GIT_REPO_SLUG}/blob/${encodeURIComponent(ref)}/${file}`;
}

/** "Team project · Some University · 2025" (the year only when the context lacks it). */
export function projectSubtitle(project: Project): string | undefined {
  const year = project.year && !project.context?.includes(project.year) ? project.year : null;
  return [project.context, year].filter(Boolean).join(" · ") || undefined;
}

/** A project's own page, in the given language: /projects/<slug> or /ar/projects/<slug>. */
export function projectPath(locale: string, slug: string): string {
  return localePath(locale, `/projects/${encodeURIComponent(slug)}`);
}

/** Text shortened to fit a search result or link preview, cut between words with "…". */
export function clip(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** First sentence of the bio, shortened to fit a search result (about 160 characters). */
export function shortBio(settings: SiteSettings, max = 160): string {
  const bio = (settings.bio ?? "").trim();
  if (!bio) return settings.headline ?? "Portfolio";
  const first = bio.match(/^.*?[.!?](\s|$)/)?.[0]?.trim() ?? bio;
  return first.length <= max ? first : `${first.slice(0, max - 1).trimEnd()}…`;
}

/**
 * The site's description for search results and link previews: the SEO description from
 * the admin when it's filled in (shortened if it runs long), else the first sentence of the bio.
 */
export function siteDescription(settings: SiteSettings, max = 160): string {
  const seo = settings.seoDescription?.trim();
  return seo ? clip(seo, max) : shortBio(settings, max);
}

/** Terminal `whoami`: name, headline, first line of the bio, where and how I work. */
export function whoamiText(s: SiteSettings, loading: string): string {
  const lines = [
    [s.fullName, s.headline].filter(Boolean).join(" — "),
    s.bio ? shortBio(s, 220) : null,
    [s.location, s.availability].filter(Boolean).join(" · ") || null,
  ].filter(Boolean);
  return lines.length ? lines.join("\n") : loading;
}

/** The terminal's own sentences, in the page's language. */
export type SkillsTextLabels = { more: (count: number) => string; hint: string; empty: string };

/** Terminal `skills`: each category with its first few skills, in display order. */
export function skillsText(
  categories: SkillCategory[],
  labels: SkillsTextLabels,
  perCategory = 6
): string {
  const lines = categories
    .filter((c) => c.skills?.length)
    .map((c) => {
      const names = c.skills.slice(0, perCategory).map((sk) => sk.name);
      const more =
        c.skills.length > perCategory ? `, ${labels.more(c.skills.length - perCategory)}` : "";
      return `${c.name}: ${names.join(", ")}${more}`;
    });
  return lines.length ? `${lines.join("\n")}\n\n${labels.hint}` : labels.empty;
}

/** Terminal `ls projects`: each project with its year and one-line summary, in display order. */
export function projectsListText(
  projects: Project[],
  labels: { hint: string; empty: string }
): string {
  if (!projects.length) return labels.empty;
  const lines = projects.map((p) =>
    [`${p.title}${p.year ? ` (${p.year})` : ""}`, p.summary].filter(Boolean).join(" - ")
  );
  return `${lines.join("\n")}\n\n${labels.hint}`;
}

/** Terminal `cat certs`: each certification with its issuer and year, in display order. */
export function certsText(certs: Certification[], labels: { empty: string }): string {
  if (!certs.length) return labels.empty;
  return certs
    .map((c) => {
      const year = yearOf(c.issueDate);
      return `${c.name}${c.issuer ? ` - ${c.issuer}` : ""}${year ? ` (${year})` : ""}`;
    })
    .join("\n");
}

/** The year in a free-text date ("Jun 2026", "2026-06", "06/2026"), or null ("Present"). */
export function yearOf(value: string | null | undefined): string | null {
  return value?.match(/\d{4}/)?.[0] ?? null;
}

/** "2023 – 2025" or "2025 – present". An end date without a year ("Present") counts as now. */
function yearRange(start: string, end: string | null, present: string): string {
  const from = yearOf(start) ?? "";
  const to = yearOf(end) ?? present;
  if (!from) return to;
  return from === to ? from : `${from} – ${to}`;
}

/** Terminal `cat experience`: a short timeline, newest first as ordered in the admin. */
export function experienceText(
  items: Experience[],
  labels: { present: string; empty: string }
): string {
  if (!items.length) return labels.empty;
  return items
    .map((e) => `${yearRange(e.startDate, e.endDate, labels.present)}  ${e.role} @ ${e.company}`)
    .join("\n");
}

/** Terminal `cat education`: each degree with its years and awards. */
export function educationText(
  items: Education[],
  labels: { present: string; empty: string }
): string {
  if (!items.length) return labels.empty;
  return items
    .map((e) =>
      [
        `${yearRange(e.startDate, e.endDate, labels.present)}  ${e.degree} - ${e.institution}`,
        ...e.awards.map((a) => `  ★ ${a}`),
      ].join("\n")
    )
    .join("\n");
}

/**
 * Structured data (schema.org Person) for search engines, from SiteSettings.
 * Rendered as JSON inside <script type="application/ld+json">; "<" is escaped so the
 * text can never close the script tag.
 */
export function personJsonLd(s: SiteSettings, locale = "en"): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: s.fullName || undefined,
    jobTitle: s.headline || undefined,
    description: s.seoDescription?.trim() || s.bio ? siteDescription(s, 300) : undefined,
    url: `${SITE_URL}${localePath(locale, "/")}`.replace(/\/$/, ""),
    address: s.location ? { "@type": "PostalAddress", addressCountry: s.location } : undefined,
    knowsLanguage: s.spokenLanguages.length
      ? s.spokenLanguages.map((l) => l.replace(/\s*\(.*\)\s*$/, ""))
      : undefined,
    sameAs: [s.githubUrl, s.linkedInUrl].filter(Boolean),
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Structured data for a project's own page: the project as a creative work by the site's
 * owner, plus a breadcrumb trail (Home › Projects › title) that search results can show.
 * Repository links are left out on purpose: some projects keep a RepoUrl that isn't shown.
 * Escaped like personJsonLd.
 */
export function projectJsonLd(
  project: Project,
  settings: SiteSettings,
  locale: string,
  labels: { home: string; projects: string }
): string {
  const absolute = (path: string) => `${SITE_URL}${path}`.replace(/\/$/, "");
  const home = absolute(localePath(locale, "/"));
  const page = absolute(projectPath(locale, project.slug));
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${page}#project`,
        name: project.title,
        description: clip(project.summary || project.description, 300) || undefined,
        url: page,
        inLanguage: locale,
        keywords: project.tech.length ? project.tech.join(", ") : undefined,
        dateCreated: yearOf(project.year) ?? undefined,
        image: `${page}/opengraph-image`,
        author: settings.fullName
          ? { "@type": "Person", name: settings.fullName, url: home }
          : undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: labels.home, item: home },
          {
            "@type": "ListItem",
            position: 2,
            name: labels.projects,
            item: absolute(localePath(locale, "/#projects")),
          },
          { "@type": "ListItem", position: 3, name: project.title, item: page },
        ],
      },
    ],
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
