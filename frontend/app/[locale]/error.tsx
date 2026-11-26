// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import AuroraBackground from "@/components/layout/AuroraBackground";
import TerminalMessage, { actionClass } from "@/components/layout/TerminalMessage";
import { localePath } from "@/i18n/routing";

// Shown when a page crashes while rendering. Most often the free-tier API was asleep and
// didn't answer in time, so "try again" (render the page again) usually fixes it.
export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  const locale = useLocale();

  useEffect(() => {
    console.error(error); // shows in the browser console and Vercel's logs
  }, [error]);

  return (
    <main className="relative flex min-h-screen items-center px-6 py-16">
      <AuroraBackground />
      <TerminalMessage
        code=":("
        command={t("errorCommand")}
        error={t("errorError")}
        hint={t("errorHint")}
      >
        <button type="button" onClick={reset} dir="auto" className={actionClass}>
          {t("retry")}
        </button>
        <a href={localePath(locale, "/")} dir="auto" className={actionClass}>
          {t("goHome")}
        </a>
      </TerminalMessage>
    </main>
  );
}
