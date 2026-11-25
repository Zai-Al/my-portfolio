// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import AuroraBackground from "@/components/layout/AuroraBackground";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import ParallaxSection from "@/components/ui/ParallaxSection";
import ContactSection from "@/components/sections/ContactSection";
import Sidebar from "@/components/layout/Sidebar";
import ChatWidget from "@/components/chat/ChatWidget";
import SectionHeading from "@/components/ui/SectionHeading";
import AboutIntro from "@/components/sections/AboutIntro";
import EducationSection from "@/components/sections/EducationSection";
import ExperienceSection from "@/components/sections/ExperienceSection";
import CertificationsSection from "@/components/sections/CertificationsSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import SkillsSection from "@/components/sections/SkillsSection";
import CursorGlow from "@/components/layout/CursorGlow";
import LiveUpdates from "@/components/layout/LiveUpdates";
import {
  getCertifications,
  getEducation,
  getExperiences,
  getGuides,
  getProjects,
  getSiteSettings,
  getSkillCategories,
} from "@/lib/api/public";
import { personJsonLd, starterQuestions } from "@/lib/site";
import { localize } from "@/lib/i18n/localize";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  // One read per table for both languages; localize() then picks the Arabic text where it's
  // filled in, so the sections below don't care which language is showing.
  const [experiences, projects, skillCategories, certifications, education, settings, guides] =
    localize(
      await Promise.all([
        getExperiences(),
        getProjects(),
        getSkillCategories(),
        getCertifications(),
        getEducation(),
        getSiteSettings(),
        getGuides(),
      ]),
      locale
    );

  return (
    <>
      {/* md–xl: the side menu (fixed, at the start edge) would cover the centred sections'
          edge, so make room for it; from xl the margins are wide enough on their own. */}
      <main className="relative md:ps-20 xl:ps-0">
        <AuroraBackground />
        <CursorGlow />
        {/* First thing a keyboard user reaches: jump past the section menu. */}
        <a
          href="#home"
          className="sr-only rounded border border-accent bg-void px-4 py-2 font-mono text-sm text-accent focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50"
        >
          {t("common.skipToContent")}
        </a>
        <Sidebar />

        {/* Structured data for search engines (schema.org Person), from SiteSettings. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: personJsonLd(settings, locale) }}
        />
        <Hero
          settings={settings}
          skillCategories={skillCategories}
          projects={projects}
          certifications={certifications}
          experiences={experiences}
          education={education}
        />

        {/* About me */}
        <ParallaxSection id="about" speed={0.08} className="mx-auto max-w-4xl px-6 py-24">
          <AboutIntro settings={settings} />
        </ParallaxSection>

        {/* Education */}
        <ParallaxSection id="education" speed={0.1} className="mx-auto max-w-4xl px-6 py-24">
          <EducationSection education={education} />
        </ParallaxSection>

        {/* Experience */}
        <ParallaxSection id="experience" speed={0.08} className="mx-auto max-w-4xl px-6 py-24">
          <ExperienceSection experiences={experiences} />
        </ParallaxSection>

        {/* Certifications */}
        <ParallaxSection id="certifications" speed={0.1} className="mx-auto max-w-4xl px-6 py-24">
          <CertificationsSection certifications={certifications} />
        </ParallaxSection>

        {/* Skills */}
        <ParallaxSection id="skills" speed={0.12} className="mx-auto max-w-4xl px-6 py-24">
          <SkillsSection skillCategories={skillCategories} />
        </ParallaxSection>

        {/* Projects */}
        <ParallaxSection id="projects" speed={0.08} className="mx-auto max-w-4xl px-6 py-24">
          <SectionHeading>{t("projects.heading")}</SectionHeading>
          {projects.length === 0 ? (
            <p className="mt-8 font-mono text-sm text-gray-400">{t("common.noContent")}</p>
          ) : (
            <div className="mt-8">
              <ProjectsSection projects={projects} />
            </div>
          )}
        </ParallaxSection>

        {/* Contact */}
        <section id="contact" className="mx-auto max-w-4xl px-6 py-24">
          <SectionHeading>{t("contact.heading")}</SectionHeading>
          <p className="mt-3 text-gray-400">{t("contact.lead")}</p>

          <ContactSection settings={settings} />
        </section>
      </main>
      {/* Public pages only - the admin portal has its own layout. */}
      <Footer name={settings.fullName} />
      {/* Reloads this page's data the moment I save in the admin portal. */}
      <LiveUpdates />
      <ChatWidget ownerName={settings.fullName} suggestions={starterQuestions(guides)} />
    </>
  );
}
