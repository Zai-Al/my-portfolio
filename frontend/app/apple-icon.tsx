// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { ImageResponse } from "next/og";

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
        background:
          "radial-gradient(circle at 20% 15%, rgba(31,209,163,0.30), transparent 55%), radial-gradient(circle at 85% 90%, rgba(124,108,255,0.30), transparent 55%), #0a0e14",
      }}
    >
      <svg width="180" height="180" viewBox="0 0 64 64">
        <polyline
          points="17,21 29,32 17,43"
          fill="none"
          stroke="#00ff9d"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="33" y="38" width="15" height="6" rx="2" fill="#00ff9d" />
      </svg>
    </div>,
    size
  );
}
