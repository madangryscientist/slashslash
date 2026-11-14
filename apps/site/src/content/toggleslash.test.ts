import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { SITE_URL } from "#/content/site";
import { LINKS, PLANNED, TOGGLESLASH_TITLE, TRY_IT, WORKS_TODAY } from "#/content/toggleslash";

const DIST = resolve(import.meta.dirname, "../../dist");

function read(page: string): string {
  const file = resolve(DIST, page);
  if (!existsSync(file)) throw new Error(`No built page at ${file}. Run "bun run build" first.`);
  return readFileSync(file, "utf8");
}

/** Visible text only, with the quote escapes React writes undone. The commands carry no `<`, `>` or `&`. */
function visibleText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"')
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
        expect(command).not.toMatch(/[<>&"']/);
        expect(html).toContain(command);
      }
    }
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
