// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import DynamicIcon from "@/components/ui/DynamicIcon";
import Modal from "@/components/ui/Modal";
import SafeImage from "@/components/ui/SafeImage";
import type { Certification } from "@/lib/types";
import { cardHover, cardTap, revealContainer, revealItem } from "@/lib/motionVariants";

export default function CertificationsSection({
  certifications,
}: {
  certifications: Certification[];
}) {
  const [active, setActive] = useState<Certification | null>(null);
  const reduceMotion = useReducedMotion();

  return (
    <>
      <SectionHeading>Certifications</SectionHeading>
      {certifications.length === 0 && (
        <p className="mt-8 font-mono text-sm text-gray-400">
          (connect the backend to populate this from the database)
        </p>
      )}
      {certifications.length > 0 && (
        <motion.div
          className="mt-8 grid gap-4 sm:grid-cols-2"
          variants={revealContainer}
          initial={reduceMotion ? "show" : "hidden"}
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {certifications.map((cert) => (
            <motion.button
              key={cert.id}
              onClick={() => setActive(cert)}
              variants={revealItem}
              whileHover={reduceMotion ? undefined : cardHover}
              whileTap={reduceMotion ? undefined : cardTap}
              className="group flex h-full flex-col items-start rounded-xl border border-border bg-panel/40 p-5 text-left transition-colors hover:border-accent/50 hover:shadow-[0_12px_30px_-10px_rgba(0,255,157,0.25)]"
            >
              <DynamicIcon
                name={cert.icon}
                className="text-2xl text-gray-300 transition-colors duration-300 group-hover:text-accent"
              />
              <p className="mt-3 font-display text-sm font-semibold leading-snug">{cert.name}</p>
              <p className="mt-1 font-mono text-xs text-gray-400">
                {cert.issuer} · {cert.issueDate}
              </p>
              <div className="flex-1" />
              <span className="mt-6 w-full rounded border border-accent px-5 py-2 text-center font-mono text-sm text-accent transition-colors group-hover:bg-accent/10">
                view credential
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}

      <Modal
        open={active !== null}
        onClose={() => setActive(null)}
        title={active?.name ?? ""}
        subtitle={active ? `${active.issuer} · ${active.issueDate}` : undefined}
      >
        {active && (
          <div className="space-y-4">
            <SafeImage
              src={active.imageUrl}
              alt={`${active.name} certificate`}
              className="w-full rounded-lg border border-border"
              fallbackText="Certificate image unavailable"
            />
            {active.credentialId && (
              <p className="font-mono text-xs text-gray-400">
                Credential ID: {active.credentialId}
              </p>
            )}
            {active.credentialUrl ? (
              <a
                href={active.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded border border-accent px-5 py-2 text-center font-mono text-sm text-accent transition-colors hover:bg-accent/10"
              >
                verify credential →
              </a>
            ) : (
              <p className="font-mono text-xs text-gray-400">No public verification link yet.</p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
