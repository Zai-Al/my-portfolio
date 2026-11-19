// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import AuroraBackground from "@/components/layout/AuroraBackground";
import Monitoring from "@/components/layout/Monitoring";
import messages from "@/messages/en.json";
import "../globals.css";

// The admin portal is private: keep it out of search results and link previews.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

// Its own root layout: the public pages live under app/[locale] (English and Arabic), the
// admin portal is English only. The English strings are provided for the shared parts
// (popups, image fallbacks).
// Same aurora backdrop as the public site, behind the login screens and dashboard.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="font-body antialiased">
        <NextIntlClientProvider locale="en" messages={messages}>
          <div className="relative isolate min-h-screen">
            <AuroraBackground />
            {children}
          </div>
        </NextIntlClientProvider>
        <Monitoring />
      </body>
    </html>
  );
}
