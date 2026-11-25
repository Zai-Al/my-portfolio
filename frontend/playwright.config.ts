// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// Smoke tests (e2e/): a production build of the site, run against the mock API in
// e2e/mock-api.mjs, so they never touch the real database or Gemini.
// Run locally with `npm run test:e2e` (it builds first; stop `npm run dev` isn't needed).

import { defineConfig, devices } from "@playwright/test";

const SITE_PORT = 3100;
const API_PORT = 5099;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${SITE_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/mock-api.mjs",
      url: `http://localhost:${API_PORT}/health`,
      env: { MOCK_API_PORT: String(API_PORT) },
      reuseExistingServer: !isCI,
    },
    {
      // Built into its own folder, so it never clashes with a running `npm run dev`.
      command: `npm run build && npx next start -p ${SITE_PORT}`,
      url: `http://localhost:${SITE_PORT}`,
      env: {
        NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}`,
        NEXT_PUBLIC_SITE_URL: `http://localhost:${SITE_PORT}`,
        NEXT_DIST_DIR: ".next-e2e",
      },
      timeout: 240_000,
      reuseExistingServer: !isCI,
    },
  ],
});
