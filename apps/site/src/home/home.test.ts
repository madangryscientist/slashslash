import { existsSync, globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { STANDS as LANDING_STANDS } from "#/content/landing";
import { PRODUCTS } from "#/content/products";
import { CONTACT_LINE } from "#/content/site";
import { STAGES } from "#/content/stages";
import { GAPS, HERO, REPORT, STANDS, STEPS_TODAY, STORY_TOOLS, VIEW_QUESTIONS } from "#/content/story";
import { TOOL_CARDS } from "#/home/tools";
import { SECTIONS } from "#/shell/sections";

/*
 * The suite home as the site builds it, read from dist (`bunx moon run site:test` builds first):
 * on the shell in the suite's section, the hero from the story module with both actions landing on the
 * page, one card per tool the story names, and no count of tools anywhere. After the cards, the rest of
 * the story in its order: every string of its sections on the page, a row per gap and per report
 * question, a stage Pill per tool, the ask at #your-view, and every drawing finished before any script.
 */

const DIST = resolve(import.meta.dirname, "../../dist");
const SRC = resolve(import.meta.dirname, "..");

function read(file: string): string {
  const path = resolve(DIST, file);
  if (!existsSync(path)) throw new Error(`No built page at ${path}. Run the build first: bunx moon run site:build.`);
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

/** Each card's HTML, by the tool it names, in page order: from the tools to the first section after them. */
const cards = html
  .slice(html.indexOf('id="tools"'), html.indexOf("data-home-section="))
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

  test("hydrates only the report viewer, when it comes into view, and the motion island", () => {
    const islands = [...html.matchAll(/<astro-island[^>]*component-export="([^"]*)"[^>]*client="([^"]*)"/g)].map(
      (m) => `${m[1]}:${m[2]}`,
    );
    expect(islands).toEqual(["ReportViewer:visible", "Motion:load"]);
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

/** Every string in a story constant, however deep. */
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value !== null && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

/** The HTML of the section an h2 with this id opens, up to the next home section. */
function section(id: string): string {
  const start = html.indexOf(`data-home-section="${id}"`);
  expect(start, id).toBeGreaterThan(-1);
  const next = html.indexOf("data-home-section=", start + 1);
  return html.slice(start, next === -1 ? undefined : next);
}

/** Each element carrying `attr`, by its value, in page order, with the HTML up to the next one. */
function rows(chunk: string, attr: string): { name: string; html: string }[] {
  return chunk
    .split(`${attr}="`)
    .slice(1)
    .map((part) => ({ name: part.slice(0, part.indexOf('"')), html: part }));
}

const afterTools = html.slice(html.indexOf('id="tools"'));
const TITLES = [STEPS_TODAY.title, GAPS.title, REPORT.title, STANDS.title, HERO.actions[0].label];

describe("the home after the tool cards", () => {
  test("opens each section with its title as an h2, in the story's order", () => {
    const h2s = [...afterTools.matchAll(/<h2[^>]*\sid="[^"]*"[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => text(m[1] ?? ""));
    expect(h2s).toEqual(TITLES);
  });

  test("carries every string of the story's sections", () => {
    const words = text(afterTools);
    for (const line of strings([STEPS_TODAY, GAPS, REPORT, STANDS, VIEW_QUESTIONS])) {
      expect(words, line).toContain(line);
    }
  });

  test("has no @@ label", () => {
    expect(afterTools).not.toContain("@@");
  });

  test("has one gap row per gap, in order, each with its gap and its tool", () => {
    const found = rows(section("gaps"), "data-gap");
    expect(found.map((row) => row.name)).toEqual(GAPS.rows.map((row) => row.tool));
    found.forEach((row, index) => {
      const gap = GAPS.rows[index];
      const words = text(`<x ${row.html}`);
      expect(words).toContain(gap?.where);
      expect(words).toContain(gap?.gap);
      expect(words).toContain(gap?.tool);
    });
  });

  test("has one report row per question, in order, each with its question and why", () => {
    const found = rows(section("report"), "data-report");
    expect(found.map((row) => row.name)).toEqual(REPORT.rows.map((row) => row.tool));
    found.forEach((row, index) => {
      const words = text(`<x ${row.html}`);
      expect(words).toContain(REPORT.rows[index]?.question);
      expect(words).toContain(REPORT.rows[index]?.why);
    });
  });

  test("gives every tool the story names one stage Pill, SightSlash planned", () => {
    const found = rows(section("stands"), "data-stage-for");
    expect(found.map((row) => row.name)).toEqual([...STORY_TOOLS]);
    for (const row of found) {
      const stage = TOOL_CARDS.find((tool) => tool.name === row.name)?.stage;
      expect(stage, row.name).toBeDefined();
      expect(text(`<x ${row.html}`), row.name).toContain(STAGES[stage ?? "planned"].label);
    }
    expect(TOOL_CARDS.find((tool) => tool.name === "SightSlash")?.stage).toBe("planned");
  });

  test("links the report screenshot to the image itself, which is built", () => {
    const stands = section("stands");
    expect(stands).toContain('href="/report.png"');
    expect(text(stands)).toContain(LANDING_STANDS.reportOpen);
    expect(existsSync(resolve(DIST, "report.png"))).toBe(true);
  });

  test("puts the ask at #your-view: the questions in order as a numbered list, and the contact line", () => {
    expect([...html.matchAll(/id="your-view"/g)]).toHaveLength(1);
    const ask = section("your-view");
    expect(ask).toContain('id="your-view"');
    const list = ask.match(/<ol[^>]*>([\s\S]*?)<\/ol>/)?.[1] ?? "";
    const items = [...list.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => text(m[1] ?? ""));
    expect(items).toEqual([...VIEW_QUESTIONS]);
    expect(text(ask)).toContain(CONTACT_LINE);
  });

  test("with no JavaScript every drawing is finished: nothing is held in a start frame", () => {
    // The start frame is only ever drawn under `.motion`, which only the head script sets, so a page
    // with no script shows every drawing's base style: the finished drawing.
    // The flags grid on /developers has no start frame: it only replays while lit, from its finished style.
    const files = globSync("illustrations/*.css", { cwd: SRC }).filter((file) => file !== "illustrations/combinations.css");
    expect(files).toContain("illustrations/pipeline.css");
    for (const file of files) {
      const css = readFileSync(resolve(SRC, file), "utf8");
      const starts = [...css.matchAll(/[^{}]*:not\(\.played\)[^{}]*\{/g)].flatMap((m) =>
        m[0].replace(/\/\*[\s\S]*?\*\//g, "").replace("{", "").split(",").map((part) => part.trim()),
      );
      expect(starts.length, file).toBeGreaterThan(0);
      for (const selector of starts.filter((part) => part.includes(":not(.played)"))) {
        expect(selector, file).toMatch(/^\.motion /);
      }
    }
  });
});
