import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { PRODUCTS } from "#/content/products";
import { SITE_URL } from "#/content/site";
import { STAGES } from "#/content/stages";
import { LINKS, PLANNED, TOGGLESLASH_TITLE, TRY_IT, WORKS_TODAY } from "#/content/toggleslash";

const DIST = resolve(import.meta.dirname, "../../dist");

function read(page: string): string {
  const file = resolve(DIST, page);
  if (!existsSync(file)) throw new Error(`No built page at ${file}. Run "bun run build" first.`);
  return readFileSync(file, "utf8");
}

/** Visible text only, with the escapes React writes undone. The commands carry no `&`. */
function visibleText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/\s+/g, " ");
}

describe("the /toggleslash page", () => {
  test("has its own canonical address, title and exactly one h1", () => {
    const html = read("toggleslash.html");
    expect(html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]).toBe(`${SITE_URL}/toggleslash`);
    expect(html).toContain(`<title>${TOGGLESLASH_TITLE}</title>`);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toMatch(/<a [^>]*href="\/"[^>]*class="brand-link"/);
  });

  test("shows every command it says works today, and the try-it commands", () => {
    const html = read("toggleslash.html");
    const text = visibleText(html);
    for (const feature of WORKS_TODAY) {
      expect(feature.command).not.toMatch(/[<>&"']/);
      expect(text).toContain(feature.command);
      expect(text).toContain(feature.text);
    }
    for (const step of TRY_IT.steps) {
      expect(text).toContain(step.lead);
      for (const command of step.commands) {
        expect(command).not.toMatch(/[&"']/);
        expect(text).toContain(command);
      }
    }
  });

  test("sets the admin key in its own step, never to a literal placeholder", () => {
    const commands = TRY_IT.steps.flatMap((step) => step.commands);
    expect(commands.filter((command) => command.includes("=..."))).toEqual([]);
    expect(TRY_IT.steps.some((step) => step.commands.join() === "export TOGGLESLASH_TOKEN=<your key>")).toBe(true);
  });

  test("keeps the sections in order: what it is, today, try it, planned, docs", () => {
    const html = read("toggleslash.html");
    const at = ["toggleslash", "works-today", "try-it", "planned", "docs"].map((id) =>
      html.indexOf(`id="${id}"`),
    );
    expect(at.every((i) => i >= 0)).toBe(true);
    expect(at.toSorted((a, b) => a - b)).toEqual(at);
  });

  test("lists what is planned under the planned heading, and says nothing is published", () => {
    const html = read("toggleslash.html");
    const planned = html.slice(html.indexOf('id="planned"'), html.indexOf('id="docs"'));
    for (const item of PLANNED) expect(visibleText(planned)).toContain(item);
    expect(visibleText(html)).toContain("nothing is published yet");
  });

  test("links the docs in the ToggleSlash repository", () => {
    const html = read("toggleslash.html");
    for (const link of LINKS) expect(html).toContain(`href="${link.href}"`);
  });
});

describe("the /toggleslash stage line", () => {
  test("names ToggleSlash's release stage from the shared table, once, inside the intro section", () => {
    const html = read("toggleslash.html");
    const product = PRODUCTS.find((p) => p.name === "ToggleSlash");
    if (!product) throw new Error("No ToggleSlash in PRODUCTS.");
    const { label, sentence } = STAGES[product.stage];
    expect(html.match(/data-testid="stage"/g)).toHaveLength(1);
    const h1 = html.search(/<h1[\s>]/);
    const intro = html.slice(html.lastIndexOf("<section", h1), html.indexOf("<section", h1));
    const line = intro.match(/<p [^>]*data-testid="stage"[^>]*>[\s\S]*?<\/p>/)?.[0];
    expect(line).toBeDefined();
    expect(intro.indexOf(line ?? "")).toBeGreaterThan(intro.search(/<h1[\s>]/));
    expect(visibleText(line ?? "").trim()).toBe(`${label}. ${sentence}`);
  });
});
