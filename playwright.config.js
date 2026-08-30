import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke tests for the pages a visitor can reach without signing in.
 *
 * Signed-in flows (drafts, publishing, comments) are not covered here:
 * Firebase keeps the auth session in IndexedDB, which Playwright's
 * storageState does not capture, so reusing a real login is unreliable.
 * Covering those means running the Firebase emulators for the test run —
 * a separate piece of setup.
 *
 * The dev server is started automatically and talks to the live project, so
 * these tests read whatever is actually published.
 */
export default defineConfig({
  testDir: "./tests",
  // Only the browser specs. tests/rules/ holds Firestore rules tests,
  // which run on the emulator under `npm run test:rules` instead.
  testMatch: "**/*.spec.js",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",

  // The post pages run a Three.js shader. Under WSL2 the default /dev/shm is
  // small, and several parallel WebGL contexts crash the browser ("session
  // closed"), so keep concurrency low and use software rendering.
  workers: 2,

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    launchOptions: {
      args: ["--disable-dev-shm-usage", "--disable-gpu"],
    },
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
