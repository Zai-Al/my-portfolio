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

export default async function Home() {
  const [experiences, projects, skillCategories, certifications, education, settings, guides] =
    await Promise.all([
      getExperiences(),
      getProjects(),
      getSkillCategories(),
      getCertifications(),
      getEducation(),
      getSiteSettings(),
      getGuides(),
    ]);

  return (
    <>
      <main className="relative">
        <AuroraBackground />
        <CursorGlow />
        {/* First thing a keyboard user reaches: jump past the section menu. */}
        <a
          href="#home"
          className="sr-only rounded border border-accent bg-void px-4 py-2 font-mono text-sm text-accent focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
        >
          Skip to content
        </a>
        <Sidebar />

        {/* Structured data for search engines (schema.org Person), from SiteSettings. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: personJsonLd(settings) }}
        />
        <Hero settings={settings} skillCategories={skillCategories} />

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
          <SectionHeading>Projects</SectionHeading>
          {projects.length === 0 ? (
            <p className="mt-8 font-mono text-sm text-gray-400">
              (connect the backend to populate this from the database)
            </p>
          ) : (
            <div className="mt-8">
              <ProjectsSection projects={projects} />
            </div>
          )}
        </ParallaxSection>

        {/* Contact */}
        <section id="contact" className="mx-auto max-w-4xl px-6 py-24">
          <SectionHeading>Get in touch</SectionHeading>
          <p className="mt-3 text-gray-400">
            Reach out directly through any of the channels below.
          </p>

          <ContactSection settings={settings} />
        </section>
      </main>
      {/* Public pages only - the admin portal has its own layout. */}
      <Footer name={settings.fullName} />
      <ChatWidget ownerName={settings.fullName} suggestions={starterQuestions(guides)} />
    </>
  );
}
