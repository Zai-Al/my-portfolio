// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { ImageResponse } from "next/og";
import { colors, withAlpha } from "@/lib/theme";

// Home-screen icon for iPhone/iPad ("Add to Home Screen"): the favicon (app/icon.svg) as a
// 180×180 PNG, full-bleed because iOS rounds the corners itself.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: `radial-gradient(circle at 20% 15%, ${withAlpha(colors.aurora.teal, 0.3)}, transparent 55%), radial-gradient(circle at 85% 90%, ${withAlpha(colors.aurora.purple, 0.3)}, transparent 55%), ${colors.void}`,
      }}
    >
      <svg width="180" height="180" viewBox="0 0 64 64">
        <polyline
          points="17,21 29,32 17,43"
          fill="none"
          stroke={colors.accent}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="33" y="38" width="15" height="6" rx="2" fill={colors.accent} />
      </svg>
    </div>,
    size
  );
}
