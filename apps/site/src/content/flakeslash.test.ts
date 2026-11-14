import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { FLAKESLASH_TITLE, LINKS, PLANNED, TRY_IT, WORKS_TODAY } from "#/content/flakeslash";
import { PRODUCTS } from "#/content/products";
import { SITE_URL } from "#/content/site";

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

describe("the /flakeslash page", () => {
  test("has its own canonical address, title and exactly one h1", () => {
    const html = read("flakeslash.html");
    expect(html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]).toBe(`${SITE_URL}/flakeslash`);
    expect(html).toContain(`<title>${FLAKESLASH_TITLE}</title>`);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toMatch(/<a [^>]*href="\/"[^>]*class="brand-link"/);
  });

  test("shows every command it says works today, and the try-it commands", () => {
    const text = visibleText(read("flakeslash.html"));
    for (const feature of WORKS_TODAY) {
      expect(feature.command).not.toMatch(/[<>&"']/);
      expect(text).toContain(feature.command);
      expect(text).toContain(feature.text);
    }
    for (const command of TRY_IT.commands) expect(read("flakeslash.html")).toContain(command);
  });

  test("keeps the sections in order: what it is, today, try it, planned, docs", () => {
    const html = read("flakeslash.html");
    const at = ["flakeslash", "works-today", "try-it", "planned", "docs"].map((id) =>
      html.indexOf(`id="${id}"`),
    );
    expect(at.every((i) => i >= 0)).toBe(true);
    expect(at.toSorted((a, b) => a - b)).toEqual(at);
  });

  test("lists what is planned under the planned heading, after what works today", () => {
    const html = read("flakeslash.html");
    const planned = html.slice(html.indexOf('id="planned"'), html.indexOf('id="docs"'));
    for (const item of PLANNED) expect(visibleText(planned)).toContain(item);
  });

  test("links the docs in the FlakeSlash repository", () => {
    const html = read("flakeslash.html");
    for (const link of LINKS) expect(html).toContain(`href="${link.href}"`);
  });
});

describe("the link in from /developers", () => {
  /** Each tool's article on /developers, keyed by the name in its heading. */
  function articles(): Map<string, string> {
    const html = read("developers.html");
    const found = new Map<string, string>();
    for (const match of html.matchAll(/<article class="tool"[\s\S]*?<\/article>/g)) {
      const name = match[0].match(/class="tool-name">([^<]+)</)?.[1];
      if (name) found.set(name, match[0]);
    }
    return found;
  }

  test("only the FlakeSlash article links to /flakeslash", () => {
    const found = articles();
    expect([...found.keys()].toSorted()).toEqual(PRODUCTS.map((p) => p.name).toSorted());
    expect(found.get("FlakeSlash")).toContain('href="/flakeslash"');
    for (const [name, article] of found) {
      if (name !== "FlakeSlash") expect(article, name).not.toContain("More about");
    }
  });
});
