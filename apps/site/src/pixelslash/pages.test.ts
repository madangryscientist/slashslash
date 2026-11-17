import { existsSync, globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import data from "@pixelslash-src/docs/capabilities/data.json";
import { SITE_NAME } from "#/content/site";
import { STAGES } from "#/content/stages";
import { PAGES, type SitePath } from "#/pixelslash/content/pages";
import { STAGE } from "#/pixelslash/content/stage";
import { LOCAL, PIXELSLASH_DEV } from "#/pixelslash/paths";
import { ComparePage } from "#/pixelslash/pages/compare";
import { PROMISE } from "#/pixelslash/pages/home";
import { HowItWorksPage } from "#/pixelslash/pages/how-it-works";
import { PricingPage } from "#/pixelslash/pages/pricing";
import { SECTIONS } from "#/shell/sections";

/*
 * The four PixelSlash pages as the site builds them, read from dist (`bunx moon run site:test`
 * builds first): on the shell in the PixelSlash section, with their own title, address and h1, the
 * fetched images, the compare matrix, links that land, no loaded script and the shell's one stylesheet.
 */

const DIST = resolve(import.meta.dirname, "../../dist");

function read(page: string): string {
  const file = resolve(DIST, page);
  if (!existsSync(file)) throw new Error(`No built page at ${file}. Run the build first: bunx moon run site:build.`);
  return readFileSync(file, "utf8");
}

function decode(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** The stylesheets a page links, by their address. */
const stylesheets = (html: string): string[] =>
  [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1] ?? "");

/** Every h1's text in a piece of HTML. */
const headings = (html: string): string[] =>
  [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => decode(m[1] ?? ""));

/** A page's root-relative image sources. */
const images = (html: string): string[] => [...html.matchAll(/<img[^>]*\ssrc="(\/[^"]+)"/g)].map((m) => m[1] ?? "");

/** The h1 a page must carry: the copied component's own, or the home's promise. */
const h1Of = (Page: () => ReactNode): string[] => headings(renderToStaticMarkup(createElement(Page)));

/** The pages served here: the path the ported content names, the built file and the page's h1. */
const SERVED: { path: SitePath; file: string; h1: () => string[] }[] = [
  { path: "/", file: "pixelslash.html", h1: () => [PROMISE] },
  { path: "/how-it-works", file: "pixelslash/how-it-works.html", h1: () => h1Of(HowItWorksPage) },
  { path: "/compare", file: "pixelslash/compare.html", h1: () => h1Of(ComparePage) },
  { path: "/pricing", file: "pixelslash/pricing.html", h1: () => h1Of(PricingPage) },
];

const here = (path: string): string => (path === "/" ? "/pixelslash" : `/pixelslash${path}`);

/** The off-site origins the pages cite: home's link to Bun, and compare's tool sources from data.json. */
const CITED = new Set(
  ["https://bun.sh", ...data.tools.map((tool) => ("src" in tool ? tool.src : "")), ...Object.values(data.links)]
    .filter((link) => link.startsWith("https:"))
    .map((link) => new URL(link).origin),
);

test("the pages built here are the ones LOCAL names, and no other PixelSlash page", () => {
  expect(SERVED.map((page) => page.path).toSorted()).toEqual([...LOCAL].toSorted());
  expect(globSync(["pixelslash.html", "pixelslash/**/*.html"], { cwd: DIST }).toSorted()).toEqual(
    SERVED.map((page) => page.file).toSorted(),
  );
});

describe.each(SERVED)("/pixelslash$path", ({ path, file, h1 }) => {
  const html = read(file);
  const entry = PAGES.find((page) => page.to === path);

  test("sits on the shell in the PixelSlash section", () => {
    const classes = html.match(/<html[^>]*\sclass="([^"]*)"/)?.[1]?.split(/\s+/) ?? [];
    expect(classes).toContain(SECTIONS.pixelslash.day);
    expect(html).toContain(`<link rel="icon" href="${SECTIONS.pixelslash.mark}"`);
  });

  test("its canonical address is its own on slashslash.build", () => {
    expect(html).toContain(`<link rel="canonical" href="https://slashslash.build${here(path)}">`);
  });

  test("its title and description are its entry of the ported pages list", () => {
    expect(decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "")).toBe(`${entry?.title} | ${SITE_NAME}`);
    expect(decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "")).toBe(entry?.description);
  });

  test("has one h1, the page's own", () => {
    const expected = h1();
    expect(expected).toHaveLength(1);
    expect(headings(html)).toEqual(expected);
  });

  test("the sub-nav marks this page alone as current, and Docs goes to pixelslash.dev", () => {
    const nav = html.match(/<nav\b[^>]*aria-label="PixelSlash"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? "";
    const links = [...nav.matchAll(/<a\b([^>]*)>/g)].map((m) => m[1] ?? "");
    const current = links.filter((attrs) => /\saria-current="page"/.test(attrs));
    expect(current).toHaveLength(1);
    expect(current[0]).toContain(`href="${here(path)}"`);
    expect(links.some((attrs) => attrs.includes(`href="${PIXELSLASH_DEV}/docs"`))).toBe(true);
  });
});

test("the home's hero carries the stage's label and sentence", () => {
  const html = read("pixelslash.html");
  // The hero: from the h1 to the slash demo under it.
  const hero = html.slice(html.indexOf("<h1"), html.indexOf('data-testid="slash-demo"'));
  const stage = hero.match(/<p data-testid="stage">([\s\S]*?)<\/p>/)?.[1] ?? "";
  expect(decode(stage)).toBe(`${STAGES[STAGE].label} ${STAGES[STAGE].sentence}`);
});

test("the home shows both demo shots and how it works the report, all served from /pixelslash", () => {
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

describe("/pixelslash/compare's matrix", () => {
  const html = read("pixelslash/compare.html");
  const table = html.match(/<table[^>]*data-testid="matrix"[^>]*>([\s\S]*?)<\/table>/)?.[1] ?? "";
  const rows = (part: string): string[] => [...part.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1] ?? "");

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
  test("names only files that exist here, and sends PixelSlash pages not served here to pixelslash.dev", () => {
    for (const { file } of SERVED) {
      const html = read(file);
      for (const [, ref = ""] of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
        if (ref.startsWith("/")) {
          const path = ref.split(/[?#]/)[0] ?? "";
          const exists = [path, `${path}.html`, `${path}/index.html`].some((f) => existsSync(resolve(DIST, `.${f}`)));
          // The shell's own links (the suite home, the other tools, /developers) reach pages this app
          // has not built yet; the link check (site/src/content/links.test.ts) holds those to PAGES.
          if (path.startsWith("/pixelslash")) expect(exists, `${file} links ${ref}, which is not in dist`).toBe(true);
        } else if (/^https?:/.test(ref)) {
          const url = new URL(ref);
          const allowed =
            url.origin === PIXELSLASH_DEV ||
            url.origin === "https://github.com" ||
            url.origin === "https://slashslash.build" ||
            CITED.has(url.origin);
          expect(allowed, `${file} links ${ref}`).toBe(true);
        }
      }
      // Every PixelSlash page the copy names goes here when it is served here, else to pixelslash.dev.
      for (const other of PAGES.filter((page) => !LOCAL.includes(page.to)))
        expect(html, `${file}: ${other.label}`).not.toContain(`href="${here(other.to)}"`);
    }
  });

  test("loads no script: the layout's two inline scripts import nothing, React included", () => {
    for (const { file } of SERVED) {
      const html = read(file);
      expect(html, file).not.toMatch(/<script[^>]*\ssrc=/);
      expect(html, file).not.toMatch(/<link[^>]*rel="modulepreload"/);
      for (const [, body] of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))
        expect(body, file).not.toMatch(/\bimport\s*[{(*"'\w]/);
    }
  });

  test("links exactly the shell's stylesheet, the one the 404 page links", () => {
    const shell = stylesheets(read("404.html"));
    expect(shell).toHaveLength(1);
    for (const { file } of SERVED) expect(stylesheets(read(file)), file).toEqual(shell);
  });
});
