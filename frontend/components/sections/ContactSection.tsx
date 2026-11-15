// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FaEnvelope, FaGithub, FaLinkedin, FaFilePdf, FaPaperPlane } from "react-icons/fa";
import type { IconType } from "react-icons";
import Modal from "@/components/ui/Modal";
import ContactForm from "@/components/sections/ContactForm";
import type { SiteSettings } from "@/lib/types";
import { ApiError } from "@/lib/api/http";
import { revealEmail } from "@/lib/api/visitor";
import { cardHover, cardTap, revealContainer, revealItem } from "@/lib/motionVariants";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const cardClass =
  "group flex flex-col items-center gap-1 rounded-xl border border-border bg-panel/40 p-5 text-center transition-colors hover:border-accent/50 hover:shadow-[0_12px_30px_-10px_rgba(0,255,157,0.25)]";

type Turnstile = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};

// Cloudflare's script, loaded once and only when someone asks for the email.
let turnstileScript: Promise<Turnstile> | null = null;
function loadTurnstile(): Promise<Turnstile> {
  const ready = () => (window as unknown as { turnstile?: Turnstile }).turnstile;
  turnstileScript ??= new Promise((resolve, reject) => {
    if (ready()) return resolve(ready()!);
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.onload = () => (ready() ? resolve(ready()!) : reject(new Error("Turnstile missing")));
    script.onerror = () => {
      turnstileScript = null; // let the next click try again
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return turnstileScript;
}

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
        {/* The email is never in the page (scrapers): it's fetched after a spam check. No phone. */}
        {settings.hasEmail && TURNSTILE_SITE_KEY && (
          <RevealEmailChannel siteKey={TURNSTILE_SITE_KEY} />
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
          className={cardClass}
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
      className={cardClass}
    >
      <Icon className="text-2xl text-accent transition-transform duration-300 group-hover:scale-110" />
      <p className="mt-2 font-display text-sm font-semibold">{label}</p>
      <p className="font-mono text-xs text-gray-400 group-hover:text-accent">{value}</p>
    </motion.a>
  );
}

/**
 * "Show email": runs Cloudflare Turnstile (invisible for most people; a checkbox appears only
 * if Cloudflare is unsure), then asks the API for the address. Bots reading the page or the
 * API never see it.
 */
function RevealEmailChannel({ siteKey }: { siteKey: string }) {
  const reduceMotion = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<{ turnstile: Turnstile; id: string } | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [error, setError] = useState("");

  const removeWidget = () => {
    if (widget.current) widget.current.turnstile.remove(widget.current.id);
    widget.current = null;
  };
  useEffect(() => removeWidget, []);

  const fail = (message: string) => {
    removeWidget();
    setError(message);
    setStatus("error");
  };

  async function reveal() {
    if (status === "checking" || !box.current) return;
    setStatus("checking");
    try {
      const turnstile = await loadTurnstile();
      removeWidget();
      const id = turnstile.render(box.current, {
        sitekey: siteKey,
        action: "reveal-email",
        appearance: "interaction-only",
        theme: "dark",
        callback: async (token: string) => {
          try {
            const result = await revealEmail(token);
            removeWidget();
            setEmail(result.email);
            setStatus("idle");
          } catch (e) {
            fail(
              e instanceof ApiError && e.status === 429
                ? "Too many tries. Please wait a few minutes."
                : "Couldn't verify. Tap to try again."
            );
          }
        },
        "error-callback": () => fail("Couldn't verify. Tap to try again."),
        "expired-callback": () => fail("The check expired. Tap to try again."),
      });
      widget.current = { turnstile, id };
    } catch {
      fail("Couldn't load the spam check. Use the message form instead.");
    }
  }

  if (email) {
    return (
      <ContactChannel Icon={FaEnvelope} label="Email" value={email} href={`mailto:${email}`} />
    );
  }

  return (
    <motion.div variants={revealItem} className="flex flex-col">
      <motion.button
        type="button"
        onClick={reveal}
        disabled={status === "checking"}
        aria-live="polite"
        whileHover={reduceMotion ? undefined : cardHover}
        whileTap={reduceMotion ? undefined : cardTap}
        className={`${cardClass} h-full disabled:cursor-wait`}
      >
        <FaEnvelope className="text-2xl text-accent transition-transform duration-300 group-hover:scale-110" />
        <p className="mt-2 font-display text-sm font-semibold">Email</p>
        <p className="font-mono text-xs text-gray-400 group-hover:text-accent">
          {status === "checking"
            ? "checking you're human…"
            : status === "error"
              ? error
              : "Show email"}
        </p>
      </motion.button>
      {/* Turnstile draws here only if it needs the visitor to tick a box. */}
      <div ref={box} className="mt-2 flex justify-center empty:hidden" />
    </motion.div>
  );
}
