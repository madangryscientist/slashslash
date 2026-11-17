import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { FLAKESLASH_TITLE, LINKS, PLANNED, TRY_IT, WORKS_TODAY } from "#/content/flakeslash";
import { PRODUCTS } from "#/content/products";
import { SITE_URL } from "#/content/site";
import { STAGES } from "#/content/stages";

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
    for (const step of TRY_IT.steps) {
      expect(text).toContain(step.lead);
      for (const command of step.commands) {
        expect(command).not.toMatch(/[&"']/);
        expect(text).toContain(command);
      }
    }
  });

  test("sets the GitHub key in its own step, never to a literal placeholder", () => {
    const commands = TRY_IT.steps.flatMap((step) => step.commands);
    expect(commands.filter((command) => command.includes("=..."))).toEqual([]);
    expect(TRY_IT.steps.some((step) => step.commands.join() === "export GITHUB_TOKEN=<your key>")).toBe(true);
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

  test("FlakeSlash links only /flakeslash, ToggleSlash only /toggleslash, and no other article has one", () => {
    const found = articles();
    expect([...found.keys()].toSorted()).toEqual(PRODUCTS.map((p) => p.name).toSorted());
    const pages: Record<string, string> = { FlakeSlash: "/flakeslash", ToggleSlash: "/toggleslash" };
    for (const [name, article] of found) {
      const own = pages[name];
      for (const page of Object.values(pages)) {
        if (page === own) expect(article, name).toContain(`href="${page}"`);
        else expect(article, name).not.toContain(`href="${page}"`);
      }
      // React writes an empty comment between the text and the name.
      if (own) expect(article, name).toMatch(new RegExp(`More about (<!-- -->)?${name}<`));
      else expect(article, name).not.toContain("More about");
    }
  });
});

describe("the /flakeslash stage line", () => {
  test("names FlakeSlash's release stage from the shared table, once, inside the intro section", () => {
    const html = read("flakeslash.html");
    const product = PRODUCTS.find((p) => p.name === "FlakeSlash");
    if (!product) throw new Error("No FlakeSlash in PRODUCTS.");
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
