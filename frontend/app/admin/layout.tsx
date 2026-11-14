// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import type { Metadata } from "next";
import AuroraBackground from "@/components/layout/AuroraBackground";

// The admin portal is private: keep it out of search results and link previews.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

// Same aurora backdrop as the public site, behind the login screens and dashboard.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate min-h-screen">
      <AuroraBackground />
      {children}
    </div>
  );
}
