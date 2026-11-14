// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/lib/api/public";

// The picture shown when the site is shared (LinkedIn, WhatsApp, Slack, X...).
// Built from SiteSettings, in the site's colours.
export const alt = "Portfolio preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const s = await getSiteSettings();
  const name = s.fullName || "Portfolio";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(circle at 15% 20%, rgba(31,209,163,0.35), transparent 45%), radial-gradient(circle at 85% 80%, rgba(124,108,255,0.35), transparent 50%), #0a0e14",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, color: "#00ff9d", fontFamily: "monospace" }}>~/portfolio</div>
        <div style={{ fontSize: 88, fontWeight: 700, marginTop: 16, letterSpacing: -2 }}>
          {name}
        </div>
        {s.headline && (
          <div style={{ fontSize: 34, color: "#9ca3af", marginTop: 20, fontFamily: "monospace" }}>
            {s.headline}
          </div>
        )}
        {s.location && (
          <div style={{ fontSize: 28, color: "#1fd1a3", marginTop: 40 }}>{s.location}</div>
        )}
      </div>
    ),
    size
  );
}
