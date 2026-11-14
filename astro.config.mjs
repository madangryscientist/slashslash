import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Two pages, built to static HTML. React renders the sections at build time; only the colour scheme
// toggle, the copy buttons, the report dialog and the motion are hydrated in the browser.
export default defineConfig({
  site: "https://slashslash.build",
  trailingSlash: "never",
  integrations: [react()],
  build: {
    // The stylesheet stays a file, so the tests can read it and the browser can cache it.
    inlineStylesheets: "never",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
