// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api/http";
import { postContact } from "@/lib/api/visitor";
import { useSlowHint } from "@/lib/useSlowHint";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "limited">("idle");
  const waking = useSlowHint(status === "sending");
  const t = useTranslations("contactForm");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      await postContact({ name, email, subject: subject || undefined, message, website });
      setStatus("sent");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setStatus(err instanceof ApiError && err.status === 429 ? "limited" : "error");
    }
  }

  if (status === "sent") {
    return <p className="mt-6 font-mono text-sm text-accent">{t("sent")}</p>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mx-auto mt-6 flex max-w-md flex-col gap-3 text-start"
    >
      {/* Honeypot: invisible to people and screen readers; bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={100}
        placeholder={t("name")}
        dir="auto"
        className="rounded border border-border bg-panel px-3 py-2 font-mono text-sm text-white outline-none focus:border-accent"
      />
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        maxLength={200}
        placeholder={t("email")}
        dir="ltr"
        className="rounded border border-border bg-panel px-3 py-2 font-mono text-sm text-white outline-none focus:border-accent"
      />
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        maxLength={200}
        placeholder={t("subject")}
        dir="auto"
        className="rounded border border-border bg-panel px-3 py-2 font-mono text-sm text-white outline-none focus:border-accent"
      />
      <textarea
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={5000}
        placeholder={t("message")}
        dir="auto"
        rows={4}
        className="rounded border border-border bg-panel px-3 py-2 font-mono text-sm text-white outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded border border-accent px-5 py-2 text-center font-mono text-sm text-accent hover:bg-accent/10 disabled:opacity-50"
      >
        {status === "sending" ? t("sending") : t("send")}
      </button>
      {waking && (
        <p role="status" className="font-mono text-xs text-gray-400">
          {t("waking")}
        </p>
      )}
      {status === "limited" && <p className="font-mono text-xs text-red-400">{t("limited")}</p>}
      {status === "error" && <p className="font-mono text-xs text-red-400">{t("error")}</p>}
    </form>
  );
}
