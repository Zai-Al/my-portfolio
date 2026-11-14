// Copyright (c) 2026 Zainab Alawi. All rights reserved.

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0a0e14", // base background
        panel: "#12161c", // card/panel surface
        border: "#2a2f3a",
        accent: "#00ff9d", // terminal green — used sparingly
        aurora: {
          teal: "#1fd1a3",
          purple: "#7c6cff",
          blue: "#3ea6ff",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "IBM Plex Mono", "monospace"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
