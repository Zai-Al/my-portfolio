// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FaEnvelope, FaGithub, FaLinkedin, FaFilePdf, FaPaperPlane, FaPhone } from "react-icons/fa";
import type { IconType } from "react-icons";
import Modal from "@/components/ui/Modal";
import ContactForm from "@/components/sections/ContactForm";
import type { SiteSettings } from "@/lib/types";
import { cardHover, cardTap, revealContainer, revealItem } from "@/lib/motionVariants";

export default function ContactSection({ settings }: { settings: SiteSettings }) {
  const [formOpen, setFormOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <>
      <motion.div
        className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={revealContainer}
        initial={reduceMotion ? "show" : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
      >
        {settings.email && (
          <ContactChannel
            Icon={FaEnvelope}
            label="Email"
            value={settings.email}
            href={`mailto:${settings.email}`}
          />
        )}
        {settings.phone && (
          <ContactChannel
            Icon={FaPhone}
            label="Phone"
            value={settings.phone}
            href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}
          />
        )}
        {settings.githubUrl && (
          <ContactChannel
            Icon={FaGithub}
            label="GitHub"
            value={settings.githubUrl.replace(/^https?:\/\/(www\.)?github\.com\//i, "")}
            href={settings.githubUrl}
          />
        )}
        {settings.linkedInUrl && (
          <ContactChannel
            Icon={FaLinkedin}
            label="LinkedIn"
            value={settings.fullName ?? "LinkedIn"}
            href={settings.linkedInUrl}
          />
        )}
        {settings.cvUrl && (
          <ContactChannel Icon={FaFilePdf} label="CV" value="View my CV" href={settings.cvUrl} />
        )}
        <motion.button
          onClick={() => setFormOpen(true)}
          variants={revealItem}
          whileHover={reduceMotion ? undefined : cardHover}
          whileTap={reduceMotion ? undefined : cardTap}
          className="group flex flex-col items-center gap-1 rounded-xl border border-border bg-panel/40 p-5 text-center transition-colors hover:border-accent/50 hover:shadow-[0_12px_30px_-10px_rgba(0,255,157,0.25)]"
        >
          <FaPaperPlane className="text-2xl text-accent transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          <p className="mt-2 font-display text-sm font-semibold">Message</p>
          <p className="font-mono text-xs text-gray-400 group-hover:text-accent">Send a message</p>
        </motion.button>
      </motion.div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Send a message"
        subtitle="I'll get back to you by email."
      >
        <ContactForm />
      </Modal>
    </>
  );
}

function ContactChannel({
  Icon,
  label,
  value,
  href,
}: {
  Icon: IconType;
  label: string;
  value: string;
  href: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variants={revealItem}
      whileHover={reduceMotion ? undefined : cardHover}
      whileTap={reduceMotion ? undefined : cardTap}
      className="group flex flex-col items-center gap-1 rounded-xl border border-border bg-panel/40 p-5 text-center transition-colors hover:border-accent/50 hover:shadow-[0_12px_30px_-10px_rgba(0,255,157,0.25)]"
    >
      <Icon className="text-2xl text-accent transition-transform duration-300 group-hover:scale-110" />
      <p className="mt-2 font-display text-sm font-semibold">{label}</p>
      <p className="font-mono text-xs text-gray-400 group-hover:text-accent">{value}</p>
    </motion.a>
  );
}
