import { defineConfig, devices } from "@playwright/test";

const PORT = 4331;
const SMOKE_BASE_URL = process.env["SMOKE_BASE_URL"];

// The page loop runs against the production build (`moon run site:e2e` builds first), served by
// `astro preview`, on a Chromium desktop and a Chromium phone. The smoke project runs only against the
// deployed host named in SMOKE_BASE_URL, so it starts no local server and needs no dist/.
export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env["CI"],
  reporter: "list",
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: "smoke.spec.ts" },
    { name: "phone", use: { ...devices["iPhone 13"], browserName: "chromium" }, testIgnore: "smoke.spec.ts" },
    ...(SMOKE_BASE_URL ? [{ name: "smoke", testMatch: "smoke.spec.ts", use: { baseURL: SMOKE_BASE_URL } }] : []),
  ],
  // astro preview has no --strictPort flag; astro.config.mjs sets vite's preview.strictPort, so a busy
  // port fails the run instead of moving the server somewhere the tests do not look. --ignore-lock keeps
  // the server in the foreground: under a coding agent astro preview otherwise moves itself to the
  // background and exits, which Playwright reads as the server dying.
  ...(SMOKE_BASE_URL
    ? {}
    : {
        webServer: {
          command: `bun run astro preview --host 127.0.0.1 --port ${PORT} --ignore-lock`,
          url: `http://127.0.0.1:${PORT}/`,
          reuseExistingServer: false,
        },
      }),
});
