import { defineConfig, devices } from "@playwright/test";

// Beside the live app's 4331, so both page loops can run on one machine.
const PORT = 4332;

// The page loop runs against the production build (`moon run site-next:e2e` builds first), served by
// `astro preview`, on a Chromium desktop and a WebKit phone. astro.config.mjs sets vite's
// preview.strictPort, so a busy port fails the run; --ignore-lock keeps the server in the foreground.
export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env["CI"],
  reporter: "list",
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: `bun run astro preview --host 127.0.0.1 --port ${PORT} --ignore-lock`,
    url: `http://127.0.0.1:${PORT}/404`,
    reuseExistingServer: false,
  },
});
