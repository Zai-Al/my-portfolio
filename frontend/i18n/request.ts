// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

// The UI strings (labels, buttons, messages) for each request. Site content comes from the
// database instead; see lib/i18n/localize.ts.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
