import { existsSync, globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { STANDS as LANDING_STANDS } from "#content/landing";
import { CONTACT_LINE } from "#content/site";
import { STAGES } from "#content/stages";
import { GAPS, HERO, REPORT, STANDS, STEPS_TODAY, STORY_TOOLS, VIEW_QUESTIONS } from "#next/content/story";
import { TOOL_CARDS } from "#next/home/tools";

/*
 * The rest of the suite home, after the tool cards, read from dist (`bunx moon run site-next:test`
 * builds first): the story's sections in its order, every string of theirs on the page, a row per gap
 * and per report question, a stage Pill per tool, the ask at #your-view, and every drawing finished
 * before any script runs.
 */

const DIST = resolve(import.meta.dirname, "../../dist");
const SRC = resolve(import.meta.dirname, "..");

const indexPath = resolve(DIST, "index.html");
if (!existsSync(indexPath)) throw new Error(`No built page at ${indexPath}. Run the build first: bunx moon run site-next:build.`);
const html = readFileSync(indexPath, "utf8");

/** Visible text: tags and scripts dropped, the escapes React and Astro write undone, spaces folded. */
function text(chunk: string): string {
  return chunk
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
    const root = html.match(/<html[^>]*\sclass="([^"]*)"/)?.[1]?.split(/\s+/) ?? [];
    expect(root).not.toContain("motion");
    expect(html).not.toMatch(/class="[^"]*\bplayed\b/);
    // The start frame is only ever drawn under `.motion`, which only the head script sets.
    const files = globSync("illustrations/*.css", { cwd: SRC });
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

describe("the home's sections' sources", () => {
  test("import nothing from the live app's components", () => {
    const files = globSync("**/*.{ts,tsx,astro}", { cwd: SRC });
    const hits = files.filter((file) =>
      /from\s+["'][^"']*(apps\/site\/src\/components|#\/components)\//.test(readFileSync(resolve(SRC, file), "utf8")),
    );
    expect(hits).toEqual([]);
  });
});
