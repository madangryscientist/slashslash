import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const here = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

// The tests read the built pages in dist/. `bunx moon run site-next:test` builds first. The live app's
// link check and build-commit check run here too, on this app's dist; SITE_NEXT lets the link check count
// a page in PAGES that this app has not built yet as live, since the live app serves it until the flip.
export default defineConfig({
  resolve: {
    alias: {
      "#next": here("./src"),
      "#content": here("../site/src/content"),
      "#ps": here("../site/src/pixelslash"),
      "@pixelslash-src": here("../site/.sources/pixelslash"),
    },
  },
  test: {
    environment: "node",
    dir: here(".."),
    include: ["site/src/content/links.test.ts", "site/src/content/build-commit.test.ts", "site-next/src/**/*.test.{ts,tsx}"],
    env: { SITE_DIST: here("./dist"), SITE_NEXT: "1" },
  },
});
