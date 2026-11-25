// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import Terminal from "@/components/sections/Terminal";
import {
  certsText,
  educationText,
  experienceText,
  projectsListText,
  skillsText,
  whoamiText,
} from "@/lib/site";
import type {
  Certification,
  Education,
  Experience,
  Project,
  SiteSettings,
  SkillCategory,
} from "@/lib/types";

/**
 * Home: name and headline centred above the terminal (the original layout), with a gentle
 * fade-in. Location, availability and the quote live in About.
 */
export default function Hero({
  settings,
  skillCategories,
  projects,
  certifications,
  experiences,
  education,
}: {
  settings: SiteSettings;
  skillCategories: SkillCategory[];
  projects: Project[];
  certifications: Certification[];
  experiences: Experience[];
  education: Education[];
}) {
  const reduceMotion = useReducedMotion();
  const t = useTranslations("terminal");
  // Always animate to visible: the server renders the starting state, so leaving out
  // "animate" for reduced motion would keep the text invisible.
  const rise = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.6, delay, ease: "easeOut" as const },
  });

  return (
    <section
      id="home"
      className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center"
    >
      <motion.div {...rise(0)}>
        {/* Arabic letters reach further below the line (ي) than Latin ones, so the Arabic
            name gets taller lines and more room before the headline. */}
        <h1 className="font-display text-5xl font-bold tracking-tight rtl:leading-[1.4] md:text-7xl rtl:md:leading-[1.4]">
          {settings.fullName}
        </h1>
        {settings.headline && (
          // dir="auto": an English headline (".NET | Java | React") keeps its order on /ar.
          <p dir="auto" className="mt-3 font-mono text-lg text-gray-400 rtl:mt-5">
            {settings.headline}
          </p>
        )}
      </motion.div>
      <motion.div {...rise(0.15)} className="flex w-full justify-center">
        <Terminal
          cvUrl={settings.cvUrl}
          githubUrl={settings.githubUrl}
          whoami={whoamiText(settings, t("loadingProfile"))}
          skills={skillsText(skillCategories, {
            more: (count) => t("more", { count }),
            hint: t("skillsHint"),
            empty: t("noSkills"),
          })}
          projectsList={projectsListText(projects, {
            hint: t("projectsHint"),
            empty: t("noProjects"),
          })}
          certs={certsText(certifications, { empty: t("noCerts") })}
          experience={experienceText(experiences, {
            present: t("present"),
            empty: t("noExperience"),
          })}
          education={educationText(education, {
            present: t("present"),
            empty: t("noEducation"),
          })}
          projects={projects.map(({ slug, title }) => ({ slug, title }))}
          className="w-full max-w-3xl"
        />
      </motion.div>
    </section>
  );
}
