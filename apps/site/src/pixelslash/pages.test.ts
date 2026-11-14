import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { PAGES } from "#ps/content/pages";
import { STATEMENT } from "#ps/content/pricing";
import { LOCAL, PIXELSLASH_DEV } from "#ps/paths";

// The built site; `bunx moon run site:test` builds it first.
const DIST = resolve(import.meta.dirname, "../../dist");

function read(page: string): string {
  const file = resolve(DIST, page);
  if (!existsSync(file)) throw new Error(`No built page at ${file}. Run the build first: bun run build.`);
  return readFileSync(file, "utf8");
}

/** Every built PixelSlash page, by its path in dist. */
function pixelslashPages(): string[] {
  const pages = globSync("pixelslash/**/*.html", { cwd: DIST });
  expect(pages).toContain("pixelslash/pricing.html");
  return pages;
}

/** The stylesheets a page links, by their address. */
function stylesheets(html: string): string[] {
  return [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1] ?? "");
}

function decode(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .trim();
}

describe("/pixelslash/pricing", () => {
  const html = read("pixelslash/pricing.html");

  test("its canonical address is on slashslash.build", () => {
    expect(html).toContain('<link rel="canonical" href="https://slashslash.build/pixelslash/pricing">');
    expect(html).toContain('property="og:url" content="https://slashslash.build/pixelslash/pricing"');
  });

  test("its title is the pricing entry of the ported pages list", () => {
    const pricing = PAGES.find((page) => page.to === "/pricing");
    expect(decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "")).toBe(pricing?.title);
  });

  test("its one h1 is the pricing component's statement", () => {
    const headings = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => decode(m[1] ?? ""));
    expect(headings).toEqual([STATEMENT]);
  });
});

describe("every PixelSlash page", () => {
  test("names only files that exist, and sends pages not served here to pixelslash.dev", () => {
    const sheets = new Set<string>();
    for (const page of pixelslashPages()) {
      const html = read(page);
      for (const sheet of stylesheets(html)) sheets.add(sheet);
      const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1] ?? "");
      for (const ref of refs) {
        if (ref.startsWith("/")) {
          const path = ref.split(/[?#]/)[0] ?? "";
          const exists = [path, `${path}.html`].some((file) => existsSync(resolve(DIST, `.${file}`)));
          expect(exists, `${page} links ${ref}, which is not in dist`).toBe(true);
          if (!/\.[a-z0-9]+$/i.test(path)) {
            const local = path === "/pixelslash" ? "/" : path.replace(/^\/pixelslash/, "");
            expect(LOCAL, `${page} links ${ref} here, but that page is not served here`).toContain(local);
          }
        } else if (/^https?:/.test(ref) && !ref.startsWith(PIXELSLASH_DEV)) {
          // Off-site: the repository, or the page's own canonical address. Neither is a PixelSlash page.
          expect(ref, `${page} links ${ref}`).toMatch(/^https:\/\/(github\.com\/|slashslash\.build\/pixelslash)/);
        }
      }
      // Every link to a PixelSlash page that is not served here goes to pixelslash.dev.
      for (const other of PAGES.filter((p) => !LOCAL.includes(p.to))) {
        const here = other.to === "/" ? "/pixelslash" : `/pixelslash${other.to}`;
        expect(html).not.toMatch(new RegExp(`href="${here}"`));
      }
    }
    expect(sheets.size).toBeGreaterThan(0);
    for (const sheet of sheets) {
      const dir = dirname(resolve(DIST, `.${sheet}`));
      const css = read(`.${sheet}`);
      for (const [, raw] of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
        const url = raw ?? "";
        if (/^(data:|#)/.test(url)) continue;
        expect(url.startsWith("/") || !/^[a-z]+:/i.test(url), `${sheet} names ${url}`).toBe(true);
        const file = url.startsWith("/") ? resolve(DIST, `.${url}`) : resolve(dir, url);
        expect(existsSync(file), `${sheet} names ${url}, which is not in dist`).toBe(true);
      }
    }
  });

  test("links the PixelSlash stylesheet and not the slashslash one, and the reverse holds", () => {
    const pixelslashSheets = new Set(pixelslashPages().flatMap((page) => stylesheets(read(page))));
    const slashslashSheets = new Set(
      ["index.html", "developers.html", "404.html"].flatMap((page) => stylesheets(read(page))),
    );
    expect(pixelslashSheets.size).toBeGreaterThan(0);
    expect(slashslashSheets.size).toBeGreaterThan(0);
    for (const sheet of pixelslashSheets) expect(slashslashSheets.has(sheet), sheet).toBe(false);
    // The PixelSlash sheet is the one carrying Inter; the slashslash sheet carries Bricolage.
    for (const sheet of pixelslashSheets) expect(read(`.${sheet}`)).not.toContain("Bricolage");
    for (const sheet of slashslashSheets) expect(read(`.${sheet}`)).not.toContain('font-family:"Inter"');
  });
});
