import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

// The slashslash pages and the PixelSlash pages under /pixelslash, built to static HTML on the Slash
// shell. React renders the pages at build time; only the colour scheme toggle, the copy buttons, the
// report viewer and the motion are hydrated in the browser.
export default defineConfig({
  site: "https://slashslash.build",
  trailingSlash: "never",
  integrations: [react()],
  build: {
    // developers.html, not developers/index.html: Cloudflare Pages serves it at /developers with no redirect.
    format: "file",
    // The stylesheet stays a file, so the tests can read it and the browser can cache it.
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
        // The PixelSlash files scripts/fetch-sources.ts downloads at the pinned commit.
        "@pixelslash-src": here("./.sources/pixelslash"),
      },
    },
  },
});
