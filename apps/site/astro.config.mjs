import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

// The slashslash pages and the PixelSlash pages under /pixelslash, built to static HTML. React renders
// the sections at build time; only the colour scheme toggle, the copy buttons, the report dialog and
// the motion are hydrated in the browser. The PixelSlash pages hydrate nothing: two small scripts in
// their layout run the theme toggle and the keyboard scrollers.
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
    resolve: {
      alias: {
        // The ported PixelSlash code (src/pixelslash) imports its own files as `#ps/...`, its repo's
        // `#/...` with the prefix renamed, since `#/` is this site's own src.
        "#ps": here("./src/pixelslash"),
        // The PixelSlash files scripts/fetch-sources.ts downloads at the pinned commit.
        "@pixelslash-src": here("./.sources/pixelslash"),
      },
    },
  },
});
