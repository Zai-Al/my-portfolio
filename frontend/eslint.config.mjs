// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// ESLint 9 flat config (Next.js 16 removed `next lint`; run `npm run lint`).
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    ".next/**",
    ".next-e2e/**",
    "playwright-report/**",
    "test-results/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
