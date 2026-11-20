import { existsSync, globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { FLOW } from "#/content/flow";
import { PRODUCTS } from "#/content/products";
import { CONTACT, DEVELOPERS_DESCRIPTION, DEVELOPERS_TITLE, SITE_NAME } from "#/content/site";
import { STAGES } from "#/content/stages";
import { DEVELOPERS } from "#/content/story";
import { DEVELOPER_QUESTIONS } from "#/developers/questions";
import { SECTIONS } from "#/shell/sections";

/*
 * /developers as the site builds it, read from dist (`bunx moon run site:test` builds first): on the
 * shell in the suite's section, in the page's order, every word of the walkthrough, env, flags, the
 * tools in detail, how to run PixelSlash today and the ask, a copy button on every command, and real and
 * imagined kept apart.
 */

const DIST = resolve(import.meta.dirname, "../../dist");
const HERE = import.meta.dirname;

function read(file: string): string {
  const path = resolve(DIST, file);
  if (!existsSync(path)) throw new Error(`No built page at ${path}. Run the build first: bunx moon run site:build.`);
  return readFileSync(path, "utf8");
}

/** Visible text: tags and scripts dropped, the escapes React and Astro write undone, spaces folded. */
function text(html: string): string {
  return html
    .replace(/<(script|style|template)[\s\S]*?<\/\1>/g, " ")
    .replace(/<\/code>/g, "")
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

const html = read("developers.html");
const words = text(html);
const between = (from: string, to: string): string => html.slice(html.indexOf(from), html.indexOf(to));

describe("/developers", () => {
  test("sits on the shell in the suite's section", () => {
    const classes = html.match(/<html[^>]*\sclass="([^"]*)"/)?.[1]?.split(/\s+/) ?? [];
    expect(classes).toContain(SECTIONS.suite.day);
  });

  test("keeps its own title and links the brand back to the suite home", () => {
    expect(text(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "")).toBe(`${DEVELOPERS_TITLE} | ${SITE_NAME}`);
    expect(html).toMatch(/<a [^>]*href="\/"/);
  });

  test("opens on one h1, For developers, with its lead, then the story's section for developers", () => {
    const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => text(m[1] ?? ""));
    expect(h1s).toEqual(["For developers"]);
    expect(html).toMatch(/<h1[^>]*id="for-developers"/);
    expect(words).toContain(DEVELOPERS_DESCRIPTION);
    for (const line of [DEVELOPERS.title, DEVELOPERS.next.text]) expect(words).toContain(line);
  });

  test("has no @@ label", () => {
    expect(words).not.toContain("@@");
  });

  test("keeps the page's order", () => {
    const ids = ["for-developers", "agents", "walkthrough", "env", "flags", "tools-detail", "today", "ask"];
    const at = ids.map((id) => html.indexOf(`id="${id}"`));
    for (const [i, place] of at.entries()) expect(place, ids[i]).toBeGreaterThan(-1);
    expect(at).toEqual(at.toSorted((a, b) => a - b));
  });

  test("renders the walkthrough, in full", () => {
    for (const step of FLOW) {
      expect(html).toContain(`id="${step.id}"`);
      for (const line of [step.label, step.title, step.story]) expect(words).toContain(line);
      for (const fit of step.fits) {
        expect(words).toContain(fit.text.text);
        for (const line of fit.output?.lines ?? []) expect(words).toContain(text(line.replace(/^\$ /, "")));
      }
    }
    const images = FLOW.flatMap((step) => step.fits.flatMap((fit) => (fit.output?.image ? [fit.output.image.src] : [])));
    for (const src of images) expect(html).toContain(`src="${src}"`);
  });

  test("reads the PixelSlash report from the fetched files, not a tracked copy", () => {
    expect(html).toContain('src="/pixelslash/report.png"');
    expect(html).not.toContain('src="/report.png"');
  });

  test("renders the install commands, the env and flags sections, and every developer question", () => {
    expect(words).toContain("npx @hackcove/pixelslash --live-png a.png --local-png b.png --out out");
    expect(words).toContain("npx @hackcove/pixelslash install-browser");
    for (const id of ["env", "flags", "today"]) expect(html).toContain(`id="${id}"`);
    expect(words).toContain("FS_TIMEOUT");
    expect(words).toContain("The combination problem");
    for (const question of DEVELOPER_QUESTIONS) expect(words).toContain(question);
    expect(words).toContain(CONTACT.lead.trim());
    expect(words).toContain(CONTACT.link);
    expect(html).toContain(`href="${CONTACT.href}"`);
  });

  test("gives every tool a card with every paragraph of its summary", () => {
    const tools = between('id="tools-detail"', 'id="today"');
    const cards = tools.split("<article").slice(1);
    expect(cards).toHaveLength(PRODUCTS.length);
    for (const [i, product] of PRODUCTS.entries()) {
      const card = text(cards[i] ?? "");
      expect(card).toContain(product.name);
      expect(card).toContain(product.question.text);
      for (const paragraph of product.summary) expect(card).toContain(paragraph.text.replaceAll("`", ""));
      // The stage's label beside the name and its sentence, in this product's own card.
      expect(cards[i], product.name).toMatch(new RegExp(`data-status-for="${product.name}"[\\s\\S]*?${STAGES[product.stage].label}<`));
      expect(card).toContain(STAGES[product.stage].sentence);
    }
  });

  test("has no tabs", () => {
    expect(html).not.toMatch(/role="tab/);
  });

  test("puts a copy button on every command block, and hydrates only the copy islands and Motion", () => {
    const main = html.slice(html.indexOf("<main"));
    const blocks = main
      .split("<figure")
      .slice(1)
      .map((chunk) => chunk.slice(0, chunk.indexOf("</figure>")))
      .filter((figure) => !figure.startsWith(" data-kind"));
    const commands = blocks.filter((figure) => />(command|bash)</.test(figure));
    // Every command in the walkthrough and Today is in one.
    const said = FLOW.flatMap((s) => s.fits.flatMap((f) => f.output?.lines ?? [])).filter((l) => l.startsWith("$ "));
    expect(commands.length).toBeGreaterThan(0);
    for (const block of commands) expect(block).toMatch(/<button[^>]*aria-label="Copy"/);
    for (const block of blocks.filter((b) => !commands.includes(b))) expect(block).not.toMatch(/aria-label="Copy"/);
    const copied = [...main.matchAll(/data-copy-text="([^"]*)"/g)].map((m) => text(m[1] ?? ""));
    for (const command of said) expect(copied.join("\n")).toContain(command.slice(2));
    const islands = [...html.matchAll(/<astro-island[^>]*component-export="([^"]+)"[^>]*>/g)];
    expect(islands.map((m) => m[1])).toEqual(["Walkthrough", "Today", "Motion"]);
    expect(islands[0]?.[0]).toContain('client="visible"');
    expect(islands[1]?.[0]).toContain('client="visible"');
  });

  test("names no count of tools or questions", () => {
    expect(words).not.toMatch(/\b(two|three|four|five|six|\d+)\s+(slash\s+)?(tools|questions)\b/i);
  });

  test("names TaskSlash, with its card linking its page", () => {
    const tools = between('id="tools-detail"', 'id="today"');
    const card = tools.split("<article").find((chunk) => text(chunk).includes("TaskSlash"));
    expect(card, "no TaskSlash card").toBeDefined();
    expect(card).toContain('href="/taskslash"');
  });
});

describe("real and imagined stay apart", () => {
  test("the FS_ table says it is imagined", () => {
    const env = between('id="env"', 'id="flags"');
    expect(env).toContain('data-kind="idea"');
    expect(env).toContain("FS_TIMEOUT");
    expect(text(env)).toContain("imagined, no tool prints this");
  });

  test("the flag note says it is made up, in one table", () => {
    const flags = between('id="flags"', 'id="tools-detail"');
    expect(flags).toContain('data-kind="made-up"');
    expect(text(flags)).toContain("Made up: no tool produces this today");
    expect(flags.match(/<table/g)).toHaveLength(1);
  });

  /** Each fit in the built walkthrough, in FLOW's order: from its h4 to the next one. */
  const fits = (() => {
    const walkthrough = between('id="walkthrough"', 'id="env"');
    const chunks = walkthrough.split("<h4").slice(1);
    return FLOW.flatMap((step) => step.fits).map((fit, i) => ({ fit, html: chunks[i] ?? "" }));
  })();

  test("a tool's stage in the walkthrough is the stage in the product data", () => {
    expect(fits.length).toBeGreaterThan(0);
    for (const { fit, html: chunk } of fits) {
      const product = PRODUCTS.find((p) => p.name === fit.tool);
      if (product === undefined) throw new Error(`No product ${fit.tool}`);
      const heading = text(`<h4${chunk.slice(0, chunk.indexOf("</h4>"))}`);
      expect(heading).toBe(`${fit.tool} ${STAGES[product.stage].label}`);
    }
  });

  test("a planned tool never shows real output", () => {
    const shown = fits.filter(({ fit, html: chunk }) => fit.stage === "planned" && chunk.includes('data-kind="real"'));
    expect(shown.map(({ fit }) => fit.tool)).toEqual([]);
  });
});

describe("the /developers sources", () => {
  const files = globSync("*.{ts,tsx}", { cwd: HERE }).filter((file) => !file.endsWith(".test.ts"));

  test("hold no hex colour", () => {
    expect(files.length).toBeGreaterThan(0);
    expect(files.filter((file) => /#[0-9a-f]{3,8}\b/i.test(readFileSync(resolve(HERE, file), "utf8")))).toEqual([]);
  });
});
