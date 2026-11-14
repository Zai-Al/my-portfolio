// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/api/public";
import { SITE_URL, shortBio } from "@/lib/site";
import Monitoring from "@/components/layout/Monitoring";
import "./globals.css";

// Title, description and link previews come from SiteSettings (cached with the content,
// refreshed when the admin saves).
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const name = s.fullName || "Portfolio";
  const title = s.headline ? `${name} — ${s.headline}` : name;
  const description = shortBio(s);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${name}` },
    description,
    authors: s.fullName ? [{ name: s.fullName }] : undefined,
    alternates: { canonical: "/" },
    openGraph: { type: "profile", title, description, url: "/", siteName: name },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body antialiased">
        {children}
        <Monitoring />
      </body>
    </html>
  );
}
