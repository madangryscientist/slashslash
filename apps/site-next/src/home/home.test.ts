import { existsSync, globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { PRODUCTS } from "#content/products";
import { STAGES } from "#content/stages";
import { HERO, REPORT, STORY_TOOLS } from "#next/content/story";
import { SECTIONS } from "#next/shell/sections";

/*
 * The suite home as this app builds it, read from dist (`bunx moon run site-next:test` builds first):
 * on the shell in the suite's section, the hero from the story module with both actions landing on the
 * page, one card per tool the story names, and no count of tools anywhere.
 */

const DIST = resolve(import.meta.dirname, "../../dist");
const SRC = resolve(import.meta.dirname, "..");

function read(file: string): string {
  const path = resolve(DIST, file);
  if (!existsSync(path)) throw new Error(`No built page at ${path}. Run the build first: bunx moon run site-next:build.`);
  return readFileSync(path, "utf8");
}

/** Visible text: tags and scripts dropped, the escapes React and Astro write undone, spaces folded. */
function text(html: string): string {
  return html
    .replace(/<(script|style|template)[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&#39;", "'")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replace(/\s+/g, " ")
    .trim();
}

const html = read("index.html");
const hero = html.slice(html.indexOf('class="hero-ground"'), html.indexOf('id="tools"'));

/** Each card's HTML, by the tool it names, in page order. */
const cards = html
  .slice(html.indexOf('id="tools"'), html.indexOf('id="your-view"'))
  .split('data-tool="')
  .slice(1)
  .map((chunk) => ({ name: chunk.slice(0, chunk.indexOf('"')), html: chunk }));

describe("/", () => {
  test("sits on the shell in the suite's section", () => {
    const classes = html.match(/<html[^>]*\sclass="([^"]*)"/)?.[1]?.split(/\s+/) ?? [];
    expect(classes).toContain(SECTIONS.suite.day);
  });

  test("has exactly one h1, the story's hero title", () => {
    const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => text(m[1] ?? ""));
    expect(h1s).toEqual([HERO.title]);
    expect(text(hero)).toContain(HERO.lead);
  });

  test("has no @@ label in the hero", () => {
    expect(hero).not.toContain("@@");
  });

  test("the hero's two actions go to #your-view and #tools, and both ids are on the page", () => {
    const links = [...hero.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({
      href: m[1],
      label: text(m[2] ?? ""),
    }));
    expect(links).toEqual(HERO.actions.map((action) => ({ href: action.href, label: action.label })));
    expect(links.map((l) => l.href)).toEqual(["#your-view", "#tools"]);
    for (const { href } of links) expect(html).toContain(`id="${href?.slice(1)}"`);
  });

  test("has one card per tool the story names, in its order, each with its question and stage", () => {
    expect(cards.map((card) => card.name)).toEqual([...STORY_TOOLS]);
    for (const card of cards) {
      const words = text(`<x ${card.html}`);
      const question = REPORT.rows.find((row) => row.tool === card.name)?.question;
      const stage = PRODUCTS.find((product) => product.name === card.name)?.stage ?? "planned";
      expect(question, card.name).toBeDefined();
      expect(words, card.name).toContain(card.name);
      expect(words, card.name).toContain(question);
      expect(words, card.name).toContain(STAGES[stage].label);
      const mark = `/brand/${card.name.toLowerCase()}-mark.svg`;
      expect(card.html, card.name).toContain(`src="${mark}"`);
      expect(existsSync(resolve(DIST, mark.slice(1))), `${mark} is built`).toBe(true);
    }
  });

  test("a card links exactly when its tool has a page here", () => {
    for (const card of cards) {
      const key = card.name.toLowerCase();
      const hrefs = [...card.html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
      expect(hrefs, card.name).toEqual(key in SECTIONS ? [SECTIONS[key as keyof typeof SECTIONS].home] : []);
      if (hrefs[0] !== undefined) expect(existsSync(resolve(DIST, `${hrefs[0].slice(1)}.html`)), card.name).toBe(true);
    }
  });

  test("never names TaskSlash", () => {
    expect(text(html)).not.toMatch(/TaskSlash/i);
    expect(html).not.toContain("taskslash");
  });

  test("counts no tools and no questions", () => {
    expect(text(html)).not.toMatch(/\b(two|three|four|five|six|\d+)\s+(slash\s+)?(tools|questions)\b/i);
  });

  test("hydrates only the motion island", () => {
    const islands = [...html.matchAll(/<astro-island[^>]*component-export="([^"]*)"/g)].map((m) => m[1]);
    expect(islands).toEqual(["Motion"]);
  });
});

describe("the home's own sources", () => {
  test("hold no hex colour", () => {
    const files = globSync("{illustrations,home}/**/*.{ts,tsx,css}", { cwd: SRC });
    expect(files.length).toBeGreaterThan(0);
    const hits = files.filter((file) => /#[0-9a-f]{3,8}\b/i.test(readFileSync(resolve(SRC, file), "utf8")));
    expect(hits).toEqual([]);
  });
});
