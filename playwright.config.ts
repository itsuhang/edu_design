import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  // Avoid competing browser instances in the constrained preview container.
  workers: 1,
  timeout: 30000,
  reporter: "list",
  outputDir: "/tmp/edu-prototype-test-results",
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",
    viewport: { width: 1440, height: 1000 },
    launchOptions: { executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] },
    screenshot: "only-on-failure",
  },
});
