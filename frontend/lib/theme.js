// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// The site's colours, in one place. Tailwind reads them (bg-void, text-accent, aurora-teal…),
// and code that can't use Tailwind classes imports them: link-preview images, the app icon,
// inline gradients and charts. globals.css reaches them through theme('colors.…').

const colors = {
  void: "#0a0e14", // base background
  panel: "#12161c", // card/panel surface
  border: "#2a2f3a",
  ink: "#e8ecf1", // body text
  accent: "#00ff9d", // terminal green — used sparingly
  aurora: {
    teal: "#1fd1a3",
    purple: "#7c6cff",
    blue: "#3ea6ff",
  },
};

/**
 * A "#rrggbb" colour at the given opacity (0–1), for gradients and glows.
 * @param {string} hex
 * @param {number} alpha
 */
function withAlpha(hex, alpha) {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255);
  return `${hex}${a.toString(16).padStart(2, "0")}`;
}

module.exports = { colors, withAlpha };
