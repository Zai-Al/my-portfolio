// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AuroraBackground from "@/components/layout/AuroraBackground";
import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/layout/Sidebar";
import ChatWidget from "@/components/chat/ChatWidget";
import ProjectDetails from "@/components/sections/ProjectDetails";
import DynamicIcon from "@/components/ui/DynamicIcon";
import { getGuides, getProjects, getSiteSettings } from "@/lib/api/public";
import { localize } from "@/lib/i18n/localize";
import { clip, projectJsonLd, projectPath, projectSubtitle, starterQuestions } from "@/lib/site";
import { localePath } from "@/i18n/routing";

// One page per project, for links on a CV or LinkedIn and for search engines. Built ahead
// of time for every project in the database (both languages); one added later is built on
// its first visit. The content is the same as the home page popup (ProjectDetails).
export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

async function findProject(slug: string, locale: string) {
  return localize((await getProjects()).find((p) => p.slug === slug) ?? null, locale);
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/projects/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const [project, settings] = await Promise.all([
    findProject(slug, locale),
    getSiteSettings().then((s) => localize(s, locale)),
  ]);
  if (!project) return {};
  const description = clip(project.summary || project.description);
  const url = projectPath(locale, slug);
  return {
    title: project.title, // the layout adds " · <name>"
    description,
    alternates: {
      canonical: url,
      languages: {
        en: projectPath("en", slug),
        ar: projectPath("ar", slug),
        "x-default": projectPath("en", slug),
      },
    },
    openGraph: {
      type: "article",
      title: project.title,
      description,
      url,
      siteName: settings.fullName || undefined,
      locale: locale === "ar" ? "ar_BH" : "en_US",
    },
    twitter: { card: "summary_large_image", title: project.title, description },
  };
}

export default async function ProjectPage({ params }: PageProps<"/[locale]/projects/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("projects");
  const nav = await getTranslations("nav");
  const [projects, settings, guides] = localize(
    await Promise.all([getProjects(), getSiteSettings(), getGuides()]),
    locale
  );
  const index = projects.findIndex((p) => p.slug === slug);
  if (index < 0) notFound();

  const project = projects[index];
  const subtitle = projectSubtitle(project);
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const rtl = locale === "ar";

  return (
    <>
      {/* md–xl: room for the side menu, as on the home page. */}
      <main className="relative min-h-screen px-6 py-16 md:ps-20 xl:ps-6">
        <AuroraBackground />
        <Sidebar variant="project" />
        {/* Structured data for search engines: the project and its breadcrumb trail. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: projectJsonLd(project, settings, locale, {
              home: nav("home"),
              projects: nav("projects"),
            }),
          }}
        />
        <article className="mx-auto max-w-3xl">
          <a
            href={localePath(locale, "/#projects")}
            className="font-mono text-xs text-gray-400 hover:text-accent"
          >
            {rtl ? "→" : "←"} {t("allProjects")}
          </a>

          <header className="mt-6 flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent/60 bg-void text-accent">
              <DynamicIcon name={project.icon} />
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight rtl:leading-[1.4] md:text-4xl">
                {project.title}
              </h1>
              {subtitle && <p className="mt-1 font-mono text-sm text-gray-400">{subtitle}</p>}
            </div>
          </header>
          {project.summary && <p className="mt-5 text-lg text-gray-300">{project.summary}</p>}

          <div className="mt-8 rounded-xl border border-border bg-panel/40 p-6">
            <ProjectDetails key={project.slug} project={project} ownerName={settings.fullName} />
          </div>

          {projects.length > 1 && (
            <nav
              aria-label={t("moreProjects")}
              className="mt-8 flex items-center justify-between gap-3 font-mono text-xs"
            >
              <a
                href={projectPath(locale, previous.slug)}
                className="rounded border border-border px-3 py-1.5 text-gray-300 hover:bg-white/5"
              >
                {rtl ? "→" : "←"} {previous.title}
              </a>
              <a
                href={projectPath(locale, next.slug)}
                className="rounded border border-border px-3 py-1.5 text-gray-300 hover:bg-white/5"
              >
                {next.title} {rtl ? "←" : "→"}
              </a>
            </nav>
          )}
        </article>
      </main>
      <Footer name={settings.fullName} />
      <ChatWidget ownerName={settings.fullName} suggestions={starterQuestions(guides)} />
    </>
  );
}
