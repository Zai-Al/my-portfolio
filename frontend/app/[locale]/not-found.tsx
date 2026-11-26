// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useLocale, useTranslations } from "next-intl";
import AuroraBackground from "@/components/layout/AuroraBackground";
import Sidebar from "@/components/layout/Sidebar";
import TerminalMessage, { actionClass } from "@/components/layout/TerminalMessage";
import { localePath } from "@/i18n/routing";

// Any address that isn't a page (a typo, an old link, a deleted project), in the visitor's
// language. A client component on purpose: on the server, finding the language would read
// the request headers, which pre-built pages may not do (Next.js answers with a 500).
// No API calls, so it still shows while the backend is asleep or down.
export default function NotFound() {
  const t = useTranslations("errors");
  const locale = useLocale();
  return (
    <main className="relative flex min-h-screen items-center px-6 py-16 md:ps-20 xl:ps-6">
      {/* React moves these into <head>. */}
      <title>{t("notFoundTitle")}</title>
      <meta name="robots" content="noindex" />
      <AuroraBackground />
      <Sidebar variant="other" />
      <TerminalMessage
        code="404"
        // Raw: TerminalMessage fills in {path}, the address that was asked for.
        command={t.raw("notFoundCommand")}
        error={t.raw("notFoundError")}
        hint={t("notFoundHint")}
      >
        <a href={localePath(locale, "/")} dir="auto" className={actionClass}>
          {t("goHome")}
        </a>
        <a href={localePath(locale, "/#projects")} dir="auto" className={actionClass}>
          {t("seeProjects")}
        </a>
      </TerminalMessage>
    </main>
  );
}
