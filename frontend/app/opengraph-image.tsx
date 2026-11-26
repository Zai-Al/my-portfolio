// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/lib/api/public";
import { OG_SIZE, OgFrame, ogText } from "@/lib/og";
import { colors } from "@/lib/theme";

// The picture shown when the site is shared (LinkedIn, WhatsApp, Slack, X...).
// Built from SiteSettings, in the site's colours.
export const alt = "Portfolio preview";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const s = await getSiteSettings();
  const name = s.fullName || "Portfolio";
  return new ImageResponse(
    <OgFrame path="~/portfolio">
      <div style={{ fontSize: 88, fontWeight: 700, marginTop: 16, letterSpacing: -2 }}>{name}</div>
      {s.headline && (
        <div style={{ fontSize: 34, color: ogText.muted, marginTop: 20, fontFamily: "monospace" }}>
          {s.headline}
        </div>
      )}
      {s.location && (
        <div style={{ fontSize: 28, color: colors.aurora.teal, marginTop: 40 }}>{s.location}</div>
      )}
    </OgFrame>,
    size
  );
}
