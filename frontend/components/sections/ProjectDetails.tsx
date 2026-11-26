// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect, useEffectEvent, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { FaRobot } from "react-icons/fa";
import Lightbox from "@/components/ui/Lightbox";
import Modal from "@/components/ui/Modal";
import SafeImage from "@/components/ui/SafeImage";
import { openAiGuide } from "@/lib/aiGuide";
import type { Project } from "@/lib/types";
import { isMediaUrl } from "@/lib/media";

/** A labelled block of free text (Challenge, My role, What I learned); nothing when empty. */
function TextSection({ label, text }: { label: string; text: string | null }) {
  if (!text?.trim()) return null;
  return (
    <div>
      <h4 className="font-mono text-xs uppercase tracking-wide text-gray-400">{label}</h4>
      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-gray-300">{text}</p>
    </div>
  );
}

/**
 * Everything about one project: screenshots (with ←/→ keys and a zoomed view), description,
 * role, highlights, tech, the Repo / Demo buttons and "ask the AI guide". Shared by the
 * popup on the home page and the project's own page, so the two always match.
 * Give it `key={project.slug}` so switching projects starts at the first screenshot.
 */
export default function ProjectDetails({
  project,
  ownerName,
  onBeforeAsk,
}: {
  project: Project;
  /** From SiteSettings: the first name goes into the "ask the AI guide" question. */
  ownerName: string | null;
  /** Runs before the AI guide opens (the popup closes itself: it sits above the chat). */
  onBeforeAsk?: () => void;
}) {
  const t = useTranslations("projects");
  const [slideIndex, setSlideIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [demoNoticeOpen, setDemoNoticeOpen] = useState(false);
  // In Arabic the page runs right to left, so "previous" is on the right: the arrow keys
  // follow the screen, not the reading order.
  const rtl = useLocale() === "ar";
  const shots = project.screenshots;

  const stepSlide = (dir: -1 | 1) =>
    shots.length > 1 && setSlideIndex((i) => (i + dir + shots.length) % shots.length);

  // ←/→ flip screenshots (not while typing, not under the demo note).
  const onArrow = useEffectEvent((e: KeyboardEvent) => {
    if (demoNoticeOpen) return;
    const el = e.target as HTMLElement | null;
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    stepSlide((e.key === "ArrowLeft") !== rtl ? -1 : 1);
    // An arrow key counts as keyboard use, so the browser would draw the focus ring on
    // whatever was last clicked (a dot, ✕, the picture). In the popup, hand focus to it.
    const dialog = el?.closest<HTMLElement>('[role="dialog"]');
    if (dialog && dialog !== el) dialog.focus();
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onArrow(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function askAi() {
    const firstName = ownerName?.trim().split(/\s+/)[0];
    const question = firstName
      ? t("askQuestion", { title: project.title, name: firstName })
      : t("askQuestionNoName", { title: project.title });
    onBeforeAsk?.();
    openAiGuide(question);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="relative">
          {shots.length > 0 ? (
            // All screenshots load at once and sit on top of each other; switching only
            // changes which one is visible, so it's instant.
            <button
              type="button"
              onClick={() => setZoomed(true)}
              aria-label={t("enlarge", { n: slideIndex + 1, total: shots.length })}
              className="relative block aspect-[16/10] w-full cursor-zoom-in overflow-hidden rounded-lg border border-border bg-void"
            >
              {shots.map((src, i) => (
                <Image
                  key={`${src}-${i}`}
                  src={src}
                  alt={
                    i === slideIndex ? t("screenshotAlt", { title: project.title, n: i + 1 }) : ""
                  }
                  aria-hidden={i !== slideIndex}
                  fill
                  loading="eager"
                  sizes="(max-width: 768px) 100vw, 720px"
                  unoptimized={!isMediaUrl(src)}
                  className={`object-contain ${i === slideIndex ? "opacity-100" : "opacity-0"}`}
                />
              ))}
            </button>
          ) : (
            <SafeImage src={null} alt="" fallbackText={t("comingSoon")} />
          )}
          {shots.length > 1 && (
            <>
              <button
                type="button"
                aria-label={t("previousShot")}
                onClick={() => stepSlide(-1)}
                className="absolute start-2 top-1/2 -translate-y-1/2 rounded-full border border-border bg-void/80 px-2.5 py-1 text-gray-200 hover:border-accent hover:text-accent"
              >
                {rtl ? "›" : "‹"}
              </button>
              <button
                type="button"
                aria-label={t("nextShot")}
                onClick={() => stepSlide(1)}
                className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full border border-border bg-void/80 px-2.5 py-1 text-gray-200 hover:border-accent hover:text-accent"
              >
                {rtl ? "‹" : "›"}
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
                  aria-label={t("goToShot", { n: i + 1 })}
                  aria-current={i === slideIndex}
                  onClick={() => setSlideIndex(i)}
                  className={`h-1.5 w-1.5 rounded-full ${i === slideIndex ? "bg-accent" : "bg-gray-600"}`}
                />
              ))}
            </div>
            <span className="font-mono text-[11px] text-gray-400">
              {slideIndex + 1}/{shots.length}
              <span className="hidden sm:inline">{t("keysHint")}</span>
            </span>
          </div>
        )}
      </div>

      <p className="text-sm leading-relaxed text-gray-300">
        {project.description || project.summary}
      </p>

      {/* Read as a case study: the problem, what I did, the results, what I took away. */}
      <TextSection label={t("challenge")} text={project.challenge} />
      <TextSection label={t("myRole")} text={project.myRole} />

      {project.highlights.length > 0 && (
        <div>
          <h4 className="font-mono text-xs uppercase tracking-wide text-gray-400">
            {t("highlights")}
          </h4>
          <ul className="mt-2 space-y-1.5 text-sm text-gray-300">
            {project.highlights.map((h) => (
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

      <TextSection label={t("learned")} text={project.learned} />

      {project.tech.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {project.tech.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-border bg-panel px-3 py-1 font-mono text-xs text-gray-300"
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* The buttons follow the admin's checkboxes. The public API already leaves out a link
          whose box is off (team or client repos), so the checks here are a second guard. */}
      {project.showRepo && project.repoUrl && (
        <a
          href={project.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded border border-accent px-5 py-2 text-center font-mono text-sm text-accent transition-colors hover:bg-accent/10"
        >
          {t("viewRepo")}
        </a>
      )}
      {project.showDemo &&
        (project.demoUrl ? (
          <a
            href={project.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded border border-accent px-5 py-2 text-center font-mono text-sm text-accent transition-colors hover:bg-accent/10"
          >
            {t("viewDemo")}
          </a>
        ) : (
          <button
            onClick={() => setDemoNoticeOpen(true)}
            className="block w-full rounded border border-accent px-5 py-2 text-center font-mono text-sm text-accent transition-colors hover:bg-accent/10"
          >
            {t("viewDemo")}
          </button>
        ))}

      {/* Hands a question about this project to the AI guide (one chat for the whole site). */}
      <button
        onClick={askAi}
        className="flex w-full items-center justify-center gap-2 rounded border border-aurora-purple/60 px-5 py-2 font-mono text-sm text-aurora-purple transition-colors hover:bg-aurora-purple/10"
      >
        <FaRobot aria-hidden="true" /> {t("askAi")}
      </button>

      <Lightbox
        images={shots}
        index={zoomed ? slideIndex : null}
        alt={(i) => t("screenshotAlt", { title: project.title, n: i + 1 })}
        onIndex={setSlideIndex}
        onClose={() => setZoomed(false)}
      />

      <Modal
        open={demoNoticeOpen}
        onClose={() => setDemoNoticeOpen(false)}
        title={t("liveDemo")}
        subtitle={project.title}
      >
        <p className="text-sm text-gray-300">{project.demoNotes ?? t("demoInProgress")}</p>
      </Modal>
    </div>
  );
}
