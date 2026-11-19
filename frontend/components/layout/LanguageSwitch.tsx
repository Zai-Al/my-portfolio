// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FaGlobe } from "react-icons/fa";
import { localePath, routing } from "@/i18n/routing";

/** "/ar/playground" → "/playground"; "/ar" → "/". */
function withoutLocale(pathname: string): string {
  const stripped = pathname.replace(new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`), "");
  return stripped || "/";
}

/**
 * English ⇄ Arabic, top corner (top right in English, top left in Arabic). Opens the same
 * page in the other language and keeps the place on it (#projects, #project-<slug>…).
 */
export default function LanguageSwitch() {
  const t = useTranslations("language");
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === "ar" ? "en" : "ar";
  const href = localePath(other, withoutLocale(pathname));

  return (
    <a
      href={href}
      hrefLang={other}
      lang={other}
      aria-label={t("switchLabel")}
      title={t("switchLabel")}
      // The hash only exists in the browser, so add it at click time.
      onClick={(e) => {
        e.currentTarget.href = href + window.location.hash;
      }}
      className="fixed end-4 top-4 z-40 flex items-center gap-2 rounded-full border border-border bg-panel/80 px-3 py-1.5 font-mono text-xs text-gray-300 backdrop-blur transition-colors hover:border-accent/60 hover:text-accent"
    >
      <FaGlobe aria-hidden="true" className="h-3 w-3" />
      {t("switch")}
    </a>
  );
}
