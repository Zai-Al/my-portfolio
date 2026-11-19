// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import SectionHeading from "@/components/ui/SectionHeading";
import type { Education } from "@/lib/types";

export default function EducationSection({ education }: { education: Education[] }) {
  const reduceMotion = useReducedMotion();
  const t = useTranslations();
  // Slides in from the start edge (left, or right in Arabic).
  const fromStart = useLocale() === "ar" ? 20 : -20;

  return (
    <>
      <SectionHeading>{t("education.heading")}</SectionHeading>
      <div className="mt-8 space-y-4">
        {education.length === 0 && (
          <p className="font-mono text-sm text-gray-400">{t("common.noContent")}</p>
        )}
        {education.map((edu) => (
          <motion.div
            key={edu.id}
            className="border-s-2 border-aurora-blue py-1 ps-5 transition-colors duration-300 hover:border-accent"
            initial={reduceMotion ? false : { opacity: 0, x: fromStart }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <p className="font-display font-semibold">{edu.degree}</p>
            <p className="mt-1 font-mono text-xs text-gray-400">
              {edu.institution}
              {edu.location ? ` · ${edu.location}` : ""} · {edu.startDate}
              {` – ${edu.endDate || t("common.present")}`}
            </p>
            {edu.awards.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {edu.awards.map((a) => (
                  <span
                    key={a}
                    className="rounded-full border border-aurora-teal/40 bg-aurora-teal/10 px-3 py-1 font-mono text-xs text-aurora-teal transition-transform duration-200 hover:scale-105 hover:bg-aurora-teal/20"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </>
  );
}
