const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    trace: "on-first-retry"
  },
  webServer: {
    command: "node scripts/serve.js",
    port: 4173,
    reuseExistingServer: true,
    timeout: 120_000
  }
});
