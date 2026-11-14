// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FaLanguage, FaLightbulb, FaMapMarkerAlt, FaQuoteLeft } from "react-icons/fa";
import type { IconType } from "react-icons";
import { cardHover, revealContainer, revealItem } from "@/lib/motionVariants";
import SectionHeading from "@/components/ui/SectionHeading";
import type { SiteSettings } from "@/lib/types";

const PROFICIENCY: Record<string, number> = {
  native: 100,
  fluent: 90,
  advanced: 75,
  intermediate: 55,
  conversational: 55,
  basic: 30,
};

function proficiencyFor(label: string): number {
  const match = label.match(/\(([^)]+)\)/)?.[1]?.toLowerCase();
  if (match && PROFICIENCY[match] !== undefined) return PROFICIENCY[match];
  return 60;
}

function LanguageBar({ label }: { label: string }) {
  const reduceMotion = useReducedMotion();
  const pct = proficiencyFor(label);

  return (
    <div>
      <p className="font-mono text-sm text-gray-300">{label}</p>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent to-aurora-teal"
          initial={reduceMotion ? { width: `${pct}%` } : { width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/** One fact card: icon + small title, the same hover lift as the project and contact cards. */
function FactCard({
  Icon,
  title,
  live = false,
  className = "",
  children,
}: {
  Icon: IconType;
  title: string;
  /** A pulsing dot next to the title (for "Currently"). */
  live?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      variants={revealItem}
      whileHover={reduceMotion ? undefined : cardHover}
      className={`group rounded-xl border border-border bg-panel/40 p-6 transition-colors hover:border-accent/50 hover:shadow-[0_12px_30px_-10px_rgba(0,255,157,0.25)] ${className}`}
    >
      <p className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-wide text-gray-400">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-void text-accent transition-colors group-hover:border-accent/60">
          <Icon aria-hidden="true" className="h-3.5 w-3.5" />
        </span>
        {title}
        {live && (
          <span
            aria-hidden="true"
            className="h-2 w-2 animate-pulse rounded-full bg-accent motion-reduce:animate-none"
          />
        )}
      </p>
      <div className="mt-4">{children}</div>
    </motion.div>
  );
}

export default function AboutIntro({ settings }: { settings: SiteSettings }) {
  const reduceMotion = useReducedMotion();
  const hasCurrently = !!(settings.location || settings.availability);
  const hasLanguages = settings.spokenLanguages.length > 0;
  const hasFacts = hasCurrently || hasLanguages || settings.softSkills.length > 0;

  return (
    <>
      <SectionHeading>About me</SectionHeading>
      {settings.bio && <p className="mt-5 leading-relaxed text-gray-300">{settings.bio}</p>}
      {!settings.bio && (
        <p className="mt-5 font-mono text-sm text-gray-400">
          (connect the backend to populate this from the database)
        </p>
      )}

      {settings.heroQuote && (
        <blockquote className="mt-6 flex gap-3 border-l-2 border-accent pl-4 text-gray-300">
          <FaQuoteLeft className="mt-1 shrink-0 text-accent/60" />
          <span className="italic">{settings.heroQuote}</span>
        </blockquote>
      )}

      {hasFacts && (
        <motion.div
          className="mt-8 grid gap-4 md:grid-cols-2"
          variants={revealContainer}
          initial={reduceMotion ? "show" : "hidden"}
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          {hasCurrently && (
            <FactCard
              Icon={FaMapMarkerAlt}
              title="Currently"
              live
              className={hasLanguages ? "" : "md:col-span-2"}
            >
              {settings.location && <p className="text-gray-200">{settings.location}</p>}
              {settings.availability && (
                <p className="mt-1.5 text-sm leading-relaxed text-gray-400">
                  {settings.availability}
                </p>
              )}
            </FactCard>
          )}

          {hasLanguages && (
            <FactCard
              Icon={FaLanguage}
              title="Languages"
              className={hasCurrently ? "" : "md:col-span-2"}
            >
              <div className="space-y-3">
                {settings.spokenLanguages.map((lang) => (
                  <LanguageBar key={lang} label={lang} />
                ))}
              </div>
            </FactCard>
          )}

          {settings.softSkills.length > 0 && (
            <FactCard Icon={FaLightbulb} title="Beyond the stack" className="md:col-span-2">
              <div className="flex flex-wrap gap-2">
                {settings.softSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-border bg-panel px-3 py-1 font-mono text-xs text-gray-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </FactCard>
          )}
        </motion.div>
      )}
    </>
  );
}
