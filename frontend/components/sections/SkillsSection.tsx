// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import DynamicIcon from "@/components/ui/DynamicIcon";
import SectionHeading from "@/components/ui/SectionHeading";
import type { SkillCategory } from "@/lib/types";
import { revealContainer, revealItem } from "@/lib/motionVariants";

function SkillDot({ skill }: { skill: SkillCategory["skills"][number] }) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const t = useTranslations("skills");
  const hasIncludes = skill.includes.length > 0;

  return (
    <motion.div
      variants={revealItem}
      className="relative"
      onMouseEnter={() => hasIncludes && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <motion.button
        type="button"
        onFocus={() => hasIncludes && setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => hasIncludes && setOpen((v) => !v)}
        whileHover={reduceMotion ? undefined : { scale: 1.06 }}
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className="rounded-full border border-border bg-panel px-5 py-2.5 font-mono text-sm text-gray-300 transition-colors duration-300 hover:border-accent hover:text-accent hover:shadow-[0_0_20px_-2px_rgba(0,255,157,0.45)]"
        aria-label={hasIncludes ? t("showDetails", { name: skill.name }) : skill.name}
      >
        {skill.name}
      </motion.button>

      <AnimatePresence>
        {open && hasIncludes && (
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute bottom-full left-1/2 z-10 mb-3 w-48 -translate-x-1/2 rounded-lg border border-accent/40 bg-void/95 p-3 text-center font-mono text-xs text-gray-300 shadow-xl backdrop-blur"
          >
            {skill.includes.join(" · ")}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SkillsSection({ skillCategories }: { skillCategories: SkillCategory[] }) {
  const reduceMotion = useReducedMotion();
  const t = useTranslations();

  return (
    <>
      <SectionHeading>{t("skills.heading")}</SectionHeading>
      {skillCategories.length === 0 ? (
        <p className="mt-8 font-mono text-sm text-gray-400">{t("common.noContent")}</p>
      ) : (
        <>
          <p className="mt-3 font-mono text-xs text-gray-400">{t("skills.hint")}</p>
          <div className="mt-8 space-y-10">
            {skillCategories.map((category) => (
              <div key={category.id}>
                <p className="flex items-center gap-2 font-display text-lg font-semibold">
                  <DynamicIcon name={category.icon} className="text-accent" />
                  {category.name}
                </p>
                <motion.div
                  className="mt-5 flex flex-wrap gap-3"
                  variants={revealContainer}
                  initial={reduceMotion ? "show" : "hidden"}
                  whileInView="show"
                  viewport={{ once: true, margin: "-60px" }}
                >
                  {category.skills.map((skill) => (
                    <SkillDot key={skill.id} skill={skill} />
                  ))}
                </motion.div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
