import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { cpSync, existsSync, readFileSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

// The PixelSlash files site:fetch-sources downloads into the live app's public/pixelslash (the slash
// demo's two shots, the report), served here at the same /pixelslash/... addresses: copied into dist
// after a build, and answered from that folder by the dev server. Nothing is copied into this app.
const FETCHED = here("../site/public/pixelslash");
const TYPES = { ".png": "image/png", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8" };

const fetchedPixelSlashFiles = {
  name: "fetched-pixelslash-files",
  hooks: {
    "astro:config:setup": ({ updateConfig }) => {
      updateConfig({
        vite: {
          plugins: [
            {
              name: "fetched-pixelslash-files",
              configureServer(server) {
                server.middlewares.use("/pixelslash/", (req, res, next) => {
                  const file = resolve(FETCHED, `.${decodeURIComponent((req.url ?? "").split("?")[0] ?? "")}`);
                  if (!file.startsWith(FETCHED + sep) || !existsSync(file) || !statSync(file).isFile()) return next();
                  res.setHeader("Content-Type", TYPES[extname(file)] ?? "application/octet-stream");
                  res.end(readFileSync(file));
                });
              },
            },
          ],
        },
      });
    },
    "astro:build:done": ({ dir }) => {
      cpSync(FETCHED, fileURLToPath(new URL("pixelslash/", dir)), { recursive: true });
    },
  },
};

// The reskinned site, built beside the live one (apps/site) at the same paths and never deployed. It
// reads the live app's content and ported PixelSlash code where they are, so nothing is copied. Its own
// modules are `#next/...`; it never declares `#/`, so a shared file's `#/...` import resolves through
// apps/site/package.json to the live app's src. tsconfig.json maps `#/` to that src too, so the type
// checker reads a shared file's imports as the build does.
export default defineConfig({
  site: "https://slashslash.build",
  trailingSlash: "never",
  integrations: [react(), fetchedPixelSlashFiles],
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
