// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import type { ReactNode } from "react";
import grays from "tailwindcss/colors";
import { colors, withAlpha } from "@/lib/theme";

// Shared look for the link-preview images (opengraph-image.tsx files): the dark aurora
// background, the terminal-green path line and the text colours. Inline styles only, as
// next/og can't read Tailwind classes.

export const OG_SIZE = { width: 1200, height: 630 };

/** Text colours for preview images, matching the site's gray-300 / gray-400. */
export const ogText = { strong: "#ffffff", soft: grays.gray[300], muted: grays.gray[400] };

/** The page frame: aurora glow on the dark background, with a `~/path` line on top. */
export function OgFrame({ path, children }: { path: string; children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: `radial-gradient(circle at 15% 20%, ${withAlpha(colors.aurora.teal, 0.35)}, transparent 45%), radial-gradient(circle at 85% 80%, ${withAlpha(colors.aurora.purple, 0.35)}, transparent 50%), ${colors.void}`,
        color: ogText.strong,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 28, color: colors.accent, fontFamily: "monospace" }}>{path}</div>
      {children}
    </div>
  );
}
