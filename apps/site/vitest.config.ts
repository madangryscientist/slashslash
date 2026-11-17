import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The tests read the built pages in dist/. `bunx moon run site:test` builds first; a bare
// `vitest run` needs `bun run build` before it.
export default defineConfig({
  resolve: {
    alias: {
      "#": fileURLToPath(new URL("./src", import.meta.url)),
      "@pixelslash-src": fileURLToPath(new URL("./.sources/pixelslash", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
