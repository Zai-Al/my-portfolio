// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// Unit tests (`npm test`): plain functions in lib/, no browser. The browser tests in e2e/
// are Playwright's (`npm run test:e2e`).

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
});
