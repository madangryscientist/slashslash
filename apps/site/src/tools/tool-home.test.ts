import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { SITE_NAME, SITE_URL } from "#/content/site";
import { STAGES } from "#/content/stages";
import { SECTIONS } from "#/shell/sections";
import { promiseOf, stageOf, TOOLS, type Tool } from "#/tools/tools";

/*
 * The two tool homes as the site builds them, read from dist (`bunx moon run site:test` builds
 * first): both from ToolHome, on the shell in their own section, with every command they name, the
 * sections in order, keys set in a step of their own and a copy button on every block.
 */

const DIST = resolve(import.meta.dirname, "../../dist");
const PAGES_DIR = resolve(import.meta.dirname, "../pages");

function read(file: string): string {
  const path = resolve(DIST, file);
  if (!existsSync(path)) throw new Error(`No built page at ${path}. Run the build first: bunx moon run site:build.`);
  return readFileSync(path, "utf8");
}

/**
 * Visible text: tags and scripts dropped, the escapes React and Astro write undone, spaces folded. A
 * span goes with no space, since the code colouring splits a command into spans.
 */
function text(html: string): string {
  return html
    .replace(/<(script|style|template)[\s\S]*?<\/\1>/g, " ")
    .replace(/<\/?span[^>]*>/g, "")
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

/** The HTML between the element with one id and the element with the next. */
const between = (html: string, from: string, to: string): string =>
  html.slice(html.indexOf(`id="${from}"`), html.indexOf(`id="${to}"`));

const ORDER = (tool: Tool): string[] => [tool.key, "works-today", "try-it", "planned", "docs"];

describe.each(Object.values(TOOLS))("/$key", (tool: Tool) => {
  const html = read(`${tool.key}.html`);

  test("is built from ToolHome, through the one tool page", () => {
    const source = readFileSync(resolve(PAGES_DIR, `${tool.key}.astro`), "utf8");
    expect(source).toContain(`<ToolPage tool="${tool.key}" />`);
  });

  test("sits on the shell in its own section", () => {
    const classes = html.match(/<html[^>]*\sclass="([^"]*)"/)?.[1]?.split(/\s+/) ?? [];
    expect(classes).toContain(SECTIONS[tool.key].day);
    expect(html).toContain(`<link rel="icon" href="${SECTIONS[tool.key].mark}"`);
  });

  test("has its own canonical address, title and exactly one h1, the promise", () => {
    expect(html).toContain(`<link rel="canonical" href="${SITE_URL}/${tool.key}">`);
    expect(text(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "")).toBe(`${tool.title} | ${SITE_NAME}`);
    const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => text(m[1] ?? ""));
    expect(h1s).toEqual([promiseOf(tool)]);
  });

  test("shows every command it says works today, and every try-it step", () => {
    const today = text(between(html, "works-today", "try-it"));
    for (const feature of tool.today) {
      expect(today).toContain(feature.command);
      expect(today).toContain(feature.text);
    }
    const tryIt = text(between(html, "try-it", "planned"));
    expect(tryIt).toContain(tool.tryIt.lead);
    for (const step of tool.tryIt.steps) {
      expect(tryIt).toContain(step.lead);
      for (const command of step.commands) expect(tryIt).toContain(command);
    }
  });

  test("keeps the sections in order: what it is, today, try it, planned, docs", () => {
    const at = ORDER(tool).map((id) => html.indexOf(`id="${id}"`));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect(at.toSorted((a, b) => a - b)).toEqual(at);
  });

  test("lists what is planned under the planned heading, after what works today", () => {
    const planned = text(between(html, "planned", "docs"));
    expect(planned).toContain(tool.planned.lead);
    for (const item of tool.planned.items) expect(planned).toContain(item);
  });

  test("links the docs in the tool's repository, and the repository from the hero", () => {
    const docs = html.slice(html.indexOf('id="docs"'));
    for (const link of tool.links) expect(docs).toContain(`href="${link.href}"`);
    expect(between(html, tool.key, "works-today")).toContain(`href="${tool.repo}"`);
    expect(between(html, tool.key, "works-today")).toContain('href="#try-it"');
  });

  test("links /developers, where the suite's tools are told apart", () => {
    expect(html).toContain('href="/developers"');
  });

  test("names its release stage from the shared table, once, in the hero under the h1", () => {
    const { label, sentence } = STAGES[stageOf(tool)];
    expect(html.match(/data-testid="stage"/g)).toHaveLength(1);
    const hero = between(html, tool.key, "works-today");
    const stage = hero.match(/<p data-testid="stage">([\s\S]*?)<\/p>/)?.[1];
    expect(stage).toBeDefined();
    expect(hero.indexOf('data-testid="stage"')).toBeGreaterThan(hero.indexOf("<h1"));
    expect(text(stage ?? "")).toBe(`${label} ${sentence}`);
  });

  test("sets the access key in a step of its own, never to a literal placeholder", () => {
    const lines = text(between(html, "try-it", "planned"));
    expect(lines).not.toContain("=...");
    const variable = tool.key === "flakeslash" ? "GITHUB_TOKEN" : "TOGGLESLASH_TOKEN";
    expect(lines).toContain(`export ${variable}=<your key>`);
  });

  test("gives every code block a copy button, and hydrates only the two copy islands", () => {
    const main = html.slice(html.indexOf(`id="${tool.key}"`));
    const figures = main.split("<figure").slice(1).map((chunk) => chunk.slice(0, chunk.indexOf("</figure>")));
    // The hero's command, and one block per try-it step.
    expect(figures).toHaveLength(1 + tool.tryIt.steps.length);
    for (const figure of figures) expect(figure).toMatch(/<button[^>]*aria-label="Copy"/);
    expect(main.match(/aria-label="Copy"/g)).toHaveLength(figures.length);
    const islands = [...html.matchAll(/<astro-island[^>]*component-export="([^"]+)"[^>]*>/g)];
    expect(islands.map((m) => m[1])).toEqual(["HeroCode", "TryIt"]);
    for (const island of islands) expect(island[0]).toContain('client="visible"');
  });
});
