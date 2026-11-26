// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import DynamicIcon from "@/components/ui/DynamicIcon";
import Modal from "@/components/ui/Modal";
import ProjectDetails from "@/components/sections/ProjectDetails";
import { projectPath, projectSubtitle } from "@/lib/site";
import type { Project } from "@/lib/types";
import { cardHover, cardTap, revealContainer, revealItem } from "@/lib/motionVariants";

export default function ProjectsSection({
  projects,
  ownerName,
}: {
  projects: Project[];
  /** From SiteSettings: the first name goes into the "ask the AI guide" question. */
  ownerName: string | null;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const t = useTranslations("projects");
  const locale = useLocale();
  const rtl = locale === "ar";

  const active = activeIndex !== null ? (projects[activeIndex] ?? null) : null;

  const stepProject = (dir: -1 | 1) =>
    activeIndex !== null && setActiveIndex((activeIndex + dir + projects.length) % projects.length);

  // "#project-<slug>" (a chatbot source link, or a shared URL) opens that project.
  const openFromHash = useEffectEvent(() => {
    const match = window.location.hash.match(/^#project-(.+)$/);
    if (!match) return;
    const index = projects.findIndex((p) => p.slug === decodeURIComponent(match[1]));
    if (index < 0) return;
    document
      .getElementById("projects")
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    setActiveIndex(index);
  });
  useEffect(() => {
    // On arrival, wait a frame so the page has laid out before scrolling to Projects.
    const frame = requestAnimationFrame(() => openFromHash());
    const handler = () => openFromHash();
    window.addEventListener("hashchange", handler);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", handler);
    };
  }, []);

  // Closing drops the hash, so the same link opens the project again next time.
  function closeProject() {
    setActiveIndex(null);
    if (window.location.hash.startsWith("#project-"))
      history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  return (
    <>
      <motion.div
        className="grid gap-6 sm:grid-cols-2"
        variants={revealContainer}
        initial={reduceMotion ? "show" : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
      >
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            variants={revealItem}
            whileHover={reduceMotion ? undefined : cardHover}
            className="group flex flex-col rounded-xl border border-border bg-panel/40 p-6 transition-colors hover:border-accent/50 hover:shadow-[0_12px_30px_-10px_rgba(0,255,157,0.25)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-void text-gray-300 transition-colors duration-300 group-hover:border-accent group-hover:text-accent">
                <DynamicIcon name={project.icon} />
              </span>
              <div>
                {/* The title links to the project's own page (shareable, and how search
                    engines find it); "View details" below opens the quick popup. */}
                <a
                  href={projectPath(locale, project.slug)}
                  className="font-display font-semibold hover:text-accent hover:underline"
                >
                  {project.title}
                </a>
                {project.context && (
                  <p className="font-mono text-xs text-gray-400">{project.context}</p>
                )}
              </div>
            </div>
            <p className="mt-4 flex-1 text-sm text-gray-300">
              {project.summary || project.description}
            </p>
            {project.tech.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tech.slice(0, 5).map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-border bg-panel px-3 py-1 font-mono text-xs text-gray-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
            <motion.button
              onClick={() => setActiveIndex(index)}
              whileTap={reduceMotion ? undefined : cardTap}
              className="mt-4 w-full rounded border border-accent px-5 py-2 text-center font-mono text-sm text-accent transition-colors hover:bg-accent/10"
            >
              {t("viewDetails")}
            </motion.button>
          </motion.div>
        ))}
      </motion.div>

      <Modal
        open={active !== null}
        onClose={closeProject}
        title={active?.title ?? ""}
        subtitle={active ? projectSubtitle(active) : undefined}
        size="lg"
      >
        {active && (
          <div className="space-y-5">
            <ProjectDetails
              key={active.slug}
              project={active}
              ownerName={ownerName}
              onBeforeAsk={closeProject}
            />

            <a
              href={projectPath(locale, active.slug)}
              className="block text-center font-mono text-xs text-gray-400 underline hover:text-accent"
            >
              {t("openPage")}
            </a>

            {projects.length > 1 && (
              <div className="flex items-center justify-between gap-3 border-t border-border pt-4 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => stepProject(-1)}
                  className="rounded border border-border px-3 py-1.5 text-gray-300 hover:bg-white/5"
                >
                  {rtl ? "→" : "←"}{" "}
                  {projects[(activeIndex! - 1 + projects.length) % projects.length].title}
                </button>
                <button
                  type="button"
                  onClick={() => stepProject(1)}
                  className="rounded border border-border px-3 py-1.5 text-gray-300 hover:bg-white/5"
                >
                  {projects[(activeIndex! + 1) % projects.length].title} {rtl ? "←" : "→"}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
