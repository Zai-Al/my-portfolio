// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect, useEffectEvent, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import DynamicIcon from "@/components/ui/DynamicIcon";
import Lightbox from "@/components/ui/Lightbox";
import Modal from "@/components/ui/Modal";
import SafeImage from "@/components/ui/SafeImage";
import type { Project } from "@/lib/types";
import { cardHover, cardTap, revealContainer, revealItem } from "@/lib/motionVariants";

const isStorage = (url: string) => url.includes("/storage/v1/object/public/portfolio-media/");

// Projects whose Repo button is shown (when their RepoUrl is set). Others keep their RepoUrl
// in the database (the AI guide can still mention it) but show no button.
const REPO_SLUGS = new Set<string>(["portfolio"]);
const DEMO_SLUGS = new Set(["failed-orders-ticketing", "quickpharma-plus"]);

export default function ProjectsSection({ projects }: { projects: Project[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [demoNoticeOpen, setDemoNoticeOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const active = activeIndex !== null ? (projects[activeIndex] ?? null) : null;
  const shots = active?.screenshots ?? [];

  function openProject(index: number) {
    setActiveIndex(index);
    setSlideIndex(0);
    setZoomed(false);
  }
  const stepProject = (dir: -1 | 1) =>
    activeIndex !== null && openProject((activeIndex + dir + projects.length) % projects.length);
  const stepSlide = (dir: -1 | 1) =>
    shots.length > 1 && setSlideIndex((i) => (i + dir + shots.length) % shots.length);

  // ←/→ flip screenshots while a project is open (not while typing, not under the demo note).
  const onArrow = useEffectEvent((e: KeyboardEvent) => {
    if (demoNoticeOpen) return;
    const el = e.target as HTMLElement | null;
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    stepSlide(e.key === "ArrowLeft" ? -1 : 1);
    // An arrow key counts as keyboard use, so the browser would draw the focus ring on
    // whatever was last clicked (a dot, ✕, the picture). Hand focus to the popup instead.
    const dialog = el?.closest<HTMLElement>('[role="dialog"]');
    if (dialog && dialog !== el) dialog.focus();
  });
  // "#project-<slug>" (a chatbot source link, or a shared URL) opens that project.
  const openFromHash = useEffectEvent(() => {
    const match = window.location.hash.match(/^#project-(.+)$/);
    if (!match) return;
    const index = projects.findIndex((p) => p.slug === decodeURIComponent(match[1]));
    if (index < 0) return;
    document
      .getElementById("projects")
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    openProject(index);
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

  useEffect(() => {
    if (activeIndex === null) return;
    const handler = (e: KeyboardEvent) => onArrow(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIndex]);

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
                <p className="font-display font-semibold">{project.title}</p>
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
                {project.tech.slice(0, 5).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border bg-panel px-3 py-1 font-mono text-xs text-gray-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            <motion.button
              onClick={() => openProject(index)}
              whileTap={reduceMotion ? undefined : cardTap}
              className="mt-4 w-full rounded border border-accent px-5 py-2 text-center font-mono text-sm text-accent transition-colors hover:bg-accent/10"
            >
              View details
            </motion.button>
          </motion.div>
        ))}
      </motion.div>

      <Modal
        open={active !== null}
        onClose={closeProject}
        title={active?.title ?? ""}
        subtitle={
          active
            ? [
                active.context,
                active.year && !active.context?.includes(active.year) ? active.year : null,
              ]
                .filter(Boolean)
                .join(" · ") || undefined
            : undefined
        }
        size="lg"
      >
        {active && (
          <div className="space-y-5">
            <div>
              <div className="relative">
                {shots.length > 0 ? (
                  // All screenshots load as soon as the popup opens and sit on top of each
                  // other; switching only changes which one is visible, so it's instant.
                  <button
                    type="button"
                    onClick={() => setZoomed(true)}
                    aria-label={`Enlarge screenshot ${slideIndex + 1} of ${shots.length}`}
                    className="relative block aspect-[16/10] w-full cursor-zoom-in overflow-hidden rounded-lg border border-border bg-void"
                  >
                    {shots.map((src, i) => (
                      <Image
                        key={`${src}-${i}`}
                        src={src}
                        alt={i === slideIndex ? `${active.title} screenshot ${i + 1}` : ""}
                        aria-hidden={i !== slideIndex}
                        fill
                        loading="eager"
                        sizes="(max-width: 768px) 100vw, 720px"
                        unoptimized={!isStorage(src)}
                        className={`object-contain ${i === slideIndex ? "opacity-100" : "opacity-0"}`}
                      />
                    ))}
                  </button>
                ) : (
                  <SafeImage src={null} alt="" fallbackText="Screenshots coming soon" />
                )}
                {shots.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous screenshot"
                      onClick={() => stepSlide(-1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-border bg-void/80 px-2.5 py-1 text-gray-200 hover:border-accent hover:text-accent"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label="Next screenshot"
                      onClick={() => stepSlide(1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-border bg-void/80 px-2.5 py-1 text-gray-200 hover:border-accent hover:text-accent"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              {shots.length > 1 && (
                <div className="mt-2 flex items-center justify-center gap-3">
                  <div className="flex gap-1.5">
                    {shots.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        aria-label={`Go to screenshot ${i + 1}`}
                        aria-current={i === slideIndex}
                        onClick={() => setSlideIndex(i)}
                        className={`h-1.5 w-1.5 rounded-full ${
                          i === slideIndex ? "bg-accent" : "bg-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[11px] text-gray-400">
                    {slideIndex + 1}/{shots.length}
                    <span className="hidden sm:inline"> · ← → keys · click to enlarge</span>
                  </span>
                </div>
              )}
            </div>

            <p className="text-sm leading-relaxed text-gray-300">
              {active.description || active.summary}
            </p>

            {active.myRole && (
              <div>
                <h4 className="font-mono text-xs uppercase tracking-wide text-gray-400">My role</h4>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-gray-300">
                  {active.myRole}
                </p>
              </div>
            )}

            {active.highlights.length > 0 && (
              <div>
                <h4 className="font-mono text-xs uppercase tracking-wide text-gray-400">
                  Highlights
                </h4>
                <ul className="mt-2 space-y-1.5 text-sm text-gray-300">
                  {active.highlights.map((h) => (
                    <li key={h} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent/70"
                      />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {active.tech.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {active.tech.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border bg-panel px-3 py-1 font-mono text-xs text-gray-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            {REPO_SLUGS.has(active.slug) && active.repoUrl && (
              <a
                href={active.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded border border-accent px-5 py-2 text-center font-mono text-sm text-accent transition-colors hover:bg-accent/10"
              >
                view repo →
              </a>
            )}
            {DEMO_SLUGS.has(active.slug) &&
              (active.demoUrl ? (
                <a
                  href={active.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded border border-accent px-5 py-2 text-center font-mono text-sm text-accent transition-colors hover:bg-accent/10"
                >
                  view demo →
                </a>
              ) : (
                <button
                  onClick={() => setDemoNoticeOpen(true)}
                  className="block w-full rounded border border-accent px-5 py-2 text-center font-mono text-sm text-accent transition-colors hover:bg-accent/10"
                >
                  view demo →
                </button>
              ))}

            {projects.length > 1 && (
              <div className="flex items-center justify-between gap-3 border-t border-border pt-4 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => stepProject(-1)}
                  className="rounded border border-border px-3 py-1.5 text-gray-300 hover:bg-white/5"
                >
                  ← {projects[(activeIndex! - 1 + projects.length) % projects.length].title}
                </button>
                <button
                  type="button"
                  onClick={() => stepProject(1)}
                  className="rounded border border-border px-3 py-1.5 text-gray-300 hover:bg-white/5"
                >
                  {projects[(activeIndex! + 1) % projects.length].title} →
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Lightbox
        images={shots}
        index={zoomed ? slideIndex : null}
        alt={(i) => `${active?.title ?? "Project"} screenshot ${i + 1}`}
        onIndex={setSlideIndex}
        onClose={() => setZoomed(false)}
      />

      <Modal
        open={demoNoticeOpen}
        onClose={() => setDemoNoticeOpen(false)}
        title="Live demo"
        subtitle={active?.title}
      >
        <p className="text-sm text-gray-300">
          {active?.demoNotes ??
            "Live demo is under progress — check back soon, or reach out for an early look."}
        </p>
      </Modal>
    </>
  );
}
