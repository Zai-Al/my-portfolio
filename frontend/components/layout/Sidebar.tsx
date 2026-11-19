// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { localePath } from "@/i18n/routing";
import {
  FaHome,
  FaUser,
  FaGraduationCap,
  FaBriefcase,
  FaCertificate,
  FaLayerGroup,
  FaProjectDiagram,
  FaPhone,
  FaGamepad,
} from "react-icons/fa";

// label = key in the "nav" strings (messages/*.json).
const SECTIONS = [
  { id: "home", label: "home", Icon: FaHome },
  { id: "about", label: "about", Icon: FaUser },
  { id: "education", label: "education", Icon: FaGraduationCap },
  { id: "experience", label: "experience", Icon: FaBriefcase },
  { id: "certifications", label: "certifications", Icon: FaCertificate },
  { id: "skills", label: "skills", Icon: FaLayerGroup },
  { id: "projects", label: "projects", Icon: FaProjectDiagram },
  { id: "contact", label: "contact", Icon: FaPhone },
  { id: "fun", label: "fun", Icon: FaGamepad, href: "/playground" },
] as const;

// On /playground: a way back home, with Playground shown as the current page.
const PLAYGROUND = [
  { id: "home", label: "home", Icon: FaHome, href: "/" },
  { id: "fun", label: "playground", Icon: FaGamepad, href: "/playground" },
] as const;

export default function Sidebar({ variant = "full" }: { variant?: "full" | "playground" }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [active, setActive] = useState(variant === "playground" ? "fun" : "home");
  const sections = variant === "playground" ? PLAYGROUND : SECTIONS;

  useEffect(() => {
    if (variant === "playground") return;
    const elements = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null
    );

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [variant]);

  // Phones: a small bar along the bottom (it covered the content on the left).
  // From md up: the floating column at the start edge (left; right in Arabic) with labels on hover.
  return (
    <nav
      aria-label={t("label")}
      className="fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 flex-row gap-1 rounded-full border border-border bg-panel/90 p-1.5 backdrop-blur md:bottom-auto md:left-6 md:rtl:left-auto md:rtl:right-6 md:top-1/2 md:translate-x-0 md:-translate-y-1/2 md:flex-col md:gap-2 md:bg-panel/80 md:p-2"
    >
      {sections.map(({ id, label: key, Icon, ...rest }) => {
        const href = "href" in rest ? localePath(locale, rest.href) : `#${id}`;
        const label = t(key);
        const isActive = active === id;
        return (
          <a
            key={id}
            href={href}
            aria-label={label}
            aria-current={isActive ? (variant === "playground" ? "page" : "location") : undefined}
            className={`group relative flex items-center rounded-full p-2 transition-colors sm:p-3 ${
              isActive
                ? "bg-accent/20 text-accent"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="pointer-events-none absolute start-full ms-3 hidden whitespace-nowrap rounded-md border border-border bg-panel px-3 py-1 font-mono text-xs text-gray-200 opacity-0 transition-opacity group-hover:opacity-100 md:block">
              {label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
