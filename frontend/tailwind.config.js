// Copyright (c) 2026 Zainab Alawi. All rights reserved.

const { colors } = require("./lib/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors,
      fontFamily: {
        // IBM Plex Sans Arabic fills in the Arabic letters on /ar (the others have none).
        display: ["Space Grotesk", "IBM Plex Sans Arabic", "sans-serif"],
        mono: ["JetBrains Mono", "IBM Plex Mono", "IBM Plex Sans Arabic", "monospace"],
        body: ["Inter", "IBM Plex Sans Arabic", "sans-serif"],
      },
    },
  },
  plugins: [],
};
