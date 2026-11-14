import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import data from "@pixelslash-src/docs/capabilities/data.json";
import { ComparePage } from "#ps/components/pages/compare";
import { HomePage } from "#ps/components/pages/home";
import { HowItWorksPage } from "#ps/components/pages/how-it-works";
import { PricingPage } from "#ps/components/pages/pricing";
import { PAGES, type SitePath } from "#ps/content/pages";
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
  const pages = globSync(["pixelslash.html", "pixelslash/**/*.html"], { cwd: DIST });
  expect(pages.toSorted()).toEqual(SERVED.map((page) => page.file).toSorted());
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

/** The pages served here: the path the ported code names, the built file and the ported component. */
const SERVED: { path: SitePath; file: string; Page: () => ReactNode }[] = [
  { path: "/", file: "pixelslash.html", Page: HomePage },
  { path: "/how-it-works", file: "pixelslash/how-it-works.html", Page: HowItWorksPage },
  { path: "/compare", file: "pixelslash/compare.html", Page: ComparePage },
  { path: "/pricing", file: "pixelslash/pricing.html", Page: PricingPage },
];

/** The off-site origins the ported pages cite: home's link to Bun, and compare's tool sources from data.json. */
const CITED = new Set(
  ["https://bun.sh", ...data.tools.map((tool) => ("src" in tool ? tool.src : "")), ...Object.values(data.links)]
    .filter((link) => link.startsWith("https:"))
    .map((link) => new URL(link).origin),
);

/** Every h1's text in a piece of HTML, tags stripped and whitespace collapsed. */
function headings(html: string): string[] {
  return [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => decode(m[1] ?? "").replace(/\s+/g, " "));
}

/** A page's root-relative image sources. */
function images(html: string): string[] {
  return [...html.matchAll(/<img[^>]*\ssrc="(\/[^"]+)"/g)].map((m) => m[1] ?? "");
}

test("the pages served here are the ones LOCAL names", () => {
  expect(SERVED.map((page) => page.path).toSorted()).toEqual([...LOCAL].toSorted());
});

describe.each(SERVED)("/pixelslash$path", ({ path, file, Page }) => {
  const html = read(file);
  const address = `https://slashslash.build/pixelslash${path === "/" ? "" : path}`;

  test("its canonical address is on slashslash.build", () => {
    expect(html).toContain(`<link rel="canonical" href="${address}">`);
    expect(html).toContain(`property="og:url" content="${address}"`);
  });

  test("ends with its body: nothing, a page script included, comes after </html>", () => {
    expect(html.trimEnd()).toMatch(/<\/body><\/html>$/);
  });

  test("its title is its entry of the ported pages list", () => {
    const entry = PAGES.find((page) => page.to === path);
    expect(decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "")).toBe(entry?.title);
  });

  test("its one h1 is the ported component's", () => {
    const ported = headings(renderToStaticMarkup(<Page />));
    expect(ported).toHaveLength(1);
    expect(headings(html)).toEqual(ported);
  });
});

describe("the images", () => {
  test("the home page shows both hero images and how it works the report, all served from /pixelslash", () => {
    const expected: [string, string[]][] = [
      ["pixelslash.html", ["/pixelslash/hero/main.png", "/pixelslash/hero/branch.png"]],
      ["pixelslash/how-it-works.html", ["/pixelslash/report.png"]],
    ];
    for (const [file, wanted] of expected) {
      const found = images(read(file));
      for (const src of wanted) {
        expect(found, file).toContain(src);
        expect(existsSync(resolve(DIST, `.${src}`)), src).toBe(true);
      }
    }
  });
});

describe("/pixelslash/compare's matrix", () => {
  const html = read("pixelslash/compare.html");
  const table = html.match(/<table[^>]*data-testid="matrix"[^>]*>([\s\S]*?)<\/table>/)?.[1] ?? "";
  const rows = (part: string): string[] =>
    [...part.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1] ?? "");

  test("has one body row per capability in the fetched data", () => {
    const body = [...table.matchAll(/<tbody[^>]*>([\s\S]*?)<\/tbody>/g)].flatMap((m) => rows(m[1] ?? ""));
    const capabilities = body.filter((row) => !row.includes('scope="rowgroup"'));
    expect(capabilities.length).toBeGreaterThan(0);
    expect(capabilities).toHaveLength(data.rows.length);
  });

  test("has a header cell for the label and each tool, PixelSlash included", () => {
    const head = rows(table.match(/<thead[^>]*>([\s\S]*?)<\/thead>/)?.[1] ?? "");
    expect(head).toHaveLength(1);
    expect([...(head[0] ?? "").matchAll(/<th[\s>]/g)]).toHaveLength(data.tools.length + 1);
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
        } else if (/^https?:/.test(ref)) {
          // pixelslash.dev, the repository, the page's own canonical address on this site, or a
          // source the ported content names: Bun on the home page, the tools' pages on compare.
          const url = new URL(ref);
          const allowed =
            url.origin === PIXELSLASH_DEV ||
            url.origin === "https://github.com" ||
            CITED.has(url.origin) ||
            (url.origin === "https://slashslash.build" && url.pathname.startsWith("/pixelslash"));
          expect(allowed, `${page} links ${ref}`).toBe(true);
        }
      }
      // The nav names every page of the PixelSlash site: a page served here by its /pixelslash
      // address, every other one on pixelslash.dev, and never a /pixelslash address for those.
      for (const other of PAGES) {
        const served = LOCAL.includes(other.to);
        const here = other.to === "/" ? "/pixelslash" : `/pixelslash${other.to}`;
        const there = `${PIXELSLASH_DEV}${other.to}`;
        expect(html, `${page}: ${other.label}`).toContain(`href="${served ? here : there}"`);
        if (!served) expect(html, `${page}: ${other.label}`).not.toContain(`href="${here}"`);
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

  test("loads no script: the two small layout scripts are inline and import nothing, React included", () => {
    for (const page of pixelslashPages()) {
      const html = read(page);
      expect(html, page).not.toMatch(/<script[^>]*\ssrc=/);
      expect(html, page).not.toMatch(/<link[^>]*rel="modulepreload"/);
      for (const [, body] of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))
        expect(body, page).not.toMatch(/\bimport\s*[{(*"'\w]/);
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
    // Each sheet carries its own site's font file and not the other's.
    for (const sheet of pixelslashSheets) {
      expect(read(`.${sheet}`)).toContain("inter-latin-wght-normal");
      expect(read(`.${sheet}`)).not.toContain("bricolage-grotesque");
    }
    for (const sheet of slashslashSheets) {
      expect(read(`.${sheet}`)).toContain("bricolage-grotesque");
      expect(read(`.${sheet}`)).not.toContain("inter-latin-wght-normal");
    }
  });
});
