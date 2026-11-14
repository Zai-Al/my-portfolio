// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FaRegEye } from "react-icons/fa";
import DynamicIcon from "@/components/ui/DynamicIcon";
import Modal from "@/components/ui/Modal";
import SafeImage from "@/components/ui/SafeImage";
import SectionHeading from "@/components/ui/SectionHeading";
import type { Experience } from "@/lib/types";

export default function ExperienceSection({ experiences }: { experiences: Experience[] }) {
  const reduceMotion = useReducedMotion();
  // The experience whose proof image (certificate, letter, award) is open.
  const [proof, setProof] = useState<Experience | null>(null);

  return (
    <>
      <SectionHeading>Experience</SectionHeading>
      {experiences.length === 0 && (
        <p className="mt-8 font-mono text-sm text-gray-400">
          (connect the backend to populate this from the database)
        </p>
      )}
      {experiences.length > 0 && (
        <div className="relative mt-10 space-y-16 border-l border-border pl-6">
          {experiences.map((exp) => (
            <motion.div
              key={exp.id}
              className="relative"
              initial={reduceMotion ? false : { opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-accent bg-void shadow-[0_0_12px_rgba(0,255,157,0.6)]" />
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <p className="flex items-center gap-3 font-display text-lg font-semibold">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-panel text-accent">
                    <DynamicIcon name={exp.icon} className="h-4 w-4" />
                  </span>
                  <span>
                    {exp.role}
                    <span className="font-normal text-gray-400"> · {exp.company}</span>
                  </span>
                </p>
                <p className="rounded-full border border-accent/30 bg-accent/5 px-3 py-1 font-mono text-xs text-accent/90">
                  {exp.startDate}
                  {exp.endDate ? ` – ${exp.endDate}` : " – present"}
                </p>
              </div>
              {(exp.department || exp.location) && (
                <p className="mt-0.5 font-mono text-xs text-gray-400">
                  {[exp.department, exp.location].filter(Boolean).join(" · ")}
                </p>
              )}
              {exp.summary && <p className="mt-2 text-sm text-gray-300">{exp.summary}</p>}
              {exp.bullets.length > 0 && (
                <ul className="mt-3 space-y-2 text-sm text-gray-300">
                  {exp.bullets.map((b) => (
                    <li key={b} className="flex gap-3">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-600" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              {(exp.tech.length > 0 || exp.proofImageUrl) && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <ul className="flex flex-wrap gap-2" aria-label="Technologies">
                    {exp.tech.map((t) => (
                      <li
                        key={t}
                        className="rounded border border-border bg-panel/60 px-2 py-0.5 font-mono text-xs text-gray-400"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                  {exp.proofImageUrl && (
                    <button
                      onClick={() => setProof(exp)}
                      className="inline-flex items-center gap-2 rounded border border-accent/60 px-3 py-1 font-mono text-xs text-accent hover:bg-accent/10"
                    >
                      <FaRegEye aria-hidden="true" /> view
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={proof !== null}
        onClose={() => setProof(null)}
        title={proof ? `${proof.role} · ${proof.company}` : ""}
        subtitle={
          proof
            ? `${proof.startDate}${proof.endDate ? ` – ${proof.endDate}` : " – present"}`
            : undefined
        }
      >
        {proof && (
          <SafeImage
            src={proof.proofImageUrl}
            alt={`Proof for ${proof.role} at ${proof.company}`}
            className="w-full rounded-lg border border-border"
            fallbackText="Image unavailable"
          />
        )}
      </Modal>
    </>
  );
}
