import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

// The reskinned site, built beside the live one (apps/site) at the same paths and never deployed. It
// reads the live app's content and ported PixelSlash code where they are, so nothing is copied. Its own
// modules are `#next/...`; it never declares `#/`, so a shared file's `#/...` import resolves through
// apps/site/package.json to the live app's src.
export default defineConfig({
  site: "https://slashslash.build",
  trailingSlash: "never",
  integrations: [react()],
  build: {
    format: "file",
    inlineStylesheets: "never",
  },
  vite: {
    plugins: [tailwindcss()],
    // Astro has no --strictPort flag. A busy port fails the dev server and the browser tests instead of
    // moving the server to a port nobody leased or the tests do not look at.
    server: { strictPort: true },
    preview: { strictPort: true },
    resolve: {
      alias: {
        "#next": here("./src"),
        "#content": here("../site/src/content"),
        "#ps": here("../site/src/pixelslash"),
        "@pixelslash-src": here("../site/.sources/pixelslash"),
      },
    },
  },
});
