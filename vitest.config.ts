import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The tests read the built pages in dist/, so run `bun run build` first.
export default defineConfig({
  resolve: { alias: { "#": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
