// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getSiteSettings } from "@/lib/api/public";
import { localize } from "@/lib/i18n/localize";
import { SITE_URL, siteDescription } from "@/lib/site";
import { isRtl, localePath, routing } from "@/i18n/routing";
import Monitoring from "@/components/layout/Monitoring";
import LanguageSwitch from "@/components/layout/LanguageSwitch";
import "../globals.css";

// Both languages are built ahead of time, like the English site was before.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Title, description and link previews come from SiteSettings (cached with the content,
// refreshed when the admin saves), in the page's language.
export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const s = localize(await getSiteSettings(), locale);
  const name = s.fullName || "Portfolio";
  const title = s.headline ? `${name} — ${s.headline}` : name;
  // The admin's SEO description, else the first sentence of the bio.
  const description = siteDescription(s);
  const url = localePath(locale, "/");
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${name}` },
    description,
    authors: s.fullName ? [{ name: s.fullName }] : undefined,
    // hreflang: tells search engines the two pages are the same content in two languages.
    alternates: { canonical: url, languages: { en: "/", ar: "/ar", "x-default": "/" } },
    openGraph: {
      type: "profile",
      title,
      description,
      url,
      siteName: name,
      locale: locale === "ar" ? "ar_BH" : "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  // Lets the pages below render statically in this language.
  setRequestLocale(locale);

  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"}>
      <body className="font-body antialiased">
        {/* Hands the UI strings for this language to the client components. */}
        <NextIntlClientProvider>
          {children}
          <LanguageSwitch />
        </NextIntlClientProvider>
        <Monitoring />
      </body>
    </html>
  );
}
