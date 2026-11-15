import { existsSync, globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { PRODUCTS } from "#/content/products";
import { STAGES } from "#/content/stages";
import { SITE_URL } from "#/content/site";
import { STAGE, STAGE_LINE } from "#/pixelslash/content/stage";

const CLIENT = resolve(import.meta.dirname, "../../dist");
const BUILT = resolve(CLIENT, "index.html");

function builtHtml(): string {
  if (!existsSync(BUILT))
    throw new Error(`No built page at ${BUILT}. Run the build first: bun run build.`);
  return readFileSync(BUILT, "utf8");
}

/**
 * Every built slashslash page: the landing page, /developers, /flakeslash, /toggleslash and the 404 page. The PixelSlash pages
 * (pixelslash/**) are PixelSlash's, with their own checks in src/pixelslash/pages.test.tsx.
 */
function builtPages(): string[] {
  builtHtml();
  const pages = globSync("**/*.html", { cwd: CLIENT }).filter(
    (page) => page !== "pixelslash.html" && !page.startsWith("pixelslash/"),
  );
  expect(pages.toSorted()).toEqual(["404.html", "developers.html", "flakeslash.html", "index.html", "toggleslash.html"]);
  return pages.map((page) => readFileSync(resolve(CLIENT, page), "utf8"));
}

/** Visible text only: tags, scripts and styles removed, entities left as they are. */
function visibleText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

describe("built page", () => {
  test("every product has its stage label next to its name, and the stage's sentence, on /developers", () => {
    builtHtml();
    const html = readFileSync(resolve(CLIENT, "developers.html"), "utf8");
    for (const product of PRODUCTS) {
      const { label, sentence } = STAGES[product.stage];
      expect(html, `${product.name} should carry "${label}"`).toMatch(
        new RegExp(`data-status-for="${product.name}"[^>]*>${label}<`),
      );
      // The name, the label and the sentence must sit in this product's own header, so that header is cut out first.
      const pill = html.indexOf(`data-status-for="${product.name}"`);
      const header = html.slice(html.lastIndexOf('<header class="tool-head">', pill), html.indexOf("</header>", pill));
      expect(header, `${product.name} should say "${sentence}" in its own header`).toContain(
        `<p class="tool-stage">${sentence}</p>`,
      );
      expect(header, `${product.name}'s label should sit beside its name`).toContain(
        `<h3 class="tool-name">${product.name}</h3>`,
      );
    }
  });

  test("PixelSlash's built page prints its stage line, and that stage is the product's stage on /developers", () => {
    expect(STAGE).toBe(PRODUCTS.find((product) => product.name === "PixelSlash")?.stage);
    const html = readFileSync(resolve(CLIENT, "pixelslash.html"), "utf8");
    expect(html).toContain(STAGE_LINE);
  });

  test("no built page keeps the retired status words", () => {
    builtHtml();
    const pages = globSync("**/*.html", { cwd: CLIENT });
    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages) {
      const html = readFileSync(resolve(CLIENT, page), "utf8");
      expect(html, `${page} should not say "Available now"`).not.toContain("Available now");
      expect(html, `${page} should not say "Works today"`).not.toContain("Works today");
      expect(html, `${page} should not say "early development"`).not.toMatch(/early development/i);
    }
  });

  test("keeps out the words the brief rules out, and the comparisons nobody checked", () => {
    const forbidden =
      /salary|\bclients?\b|employer|job hunt|notice period|\bagents?\b|\btokens?\b|Unleash|Flagsmith|GrowthBook|PostHog|Piranha|OpenFeature|LaunchDarkly MCP/i;
    for (const html of builtPages()) expect(visibleText(html).match(forbidden)?.[0]).toBeUndefined();
  });

  test("has no form, no email address and no phone number", () => {
    for (const html of builtPages()) {
      expect(html).not.toMatch(/<form[\s>]/);
      // Raw HTML, so a mailto: link cannot hide behind the tag stripping.
      expect(html).not.toMatch(/mailto:|[\w.+-]+@[\w-]+\.[\w.]+/);
      expect(visibleText(html)).not.toMatch(/\b0\d{9}\b|\+\d{8,}/);
    }
  });

  test("has a title, description and share image", () => {
    for (const html of builtPages()) {
      expect(html).toMatch(/<title>[^<]+<\/title>/);
      expect(html).toMatch(/name="description" content="[^"]{40,}"/);
      expect(html).toContain(`property="og:image" content="${SITE_URL}/og.png"`);
      expect(html).toContain(`name="twitter:image" content="${SITE_URL}/og.png"`);
    }
    expect(SITE_URL).toMatch(/^https:\/\/[^/]+$/);
  });

  test("each page has its own description", () => {
    builtPages();
    const developers = readFileSync(resolve(CLIENT, "developers.html"), "utf8");
    const landing = readFileSync(resolve(CLIENT, "index.html"), "utf8");
    const of = (html: string) => html.match(/name="description" content="([^"]*)"/)?.[1];
    expect(of(developers)).toBeDefined();
    expect(of(developers)).not.toBe(of(landing));
  });
});

describe("is open to search engines", () => {
  test("robots.txt allows every crawler and names the sitemap", () => {
    expect(readFileSync(resolve(CLIENT, "robots.txt"), "utf8")).toBe(
      `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
    );
  });

  test("the sitemap lists the pages, the PixelSlash ones included, and not the 404 page", () => {
    const sitemap = readFileSync(resolve(CLIENT, "sitemap.xml"), "utf8");
    expect([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])).toEqual([
      `${SITE_URL}/`,
      `${SITE_URL}/developers`,
      `${SITE_URL}/flakeslash`,
      `${SITE_URL}/pixelslash`,
      `${SITE_URL}/pixelslash/compare`,
      `${SITE_URL}/pixelslash/how-it-works`,
      `${SITE_URL}/pixelslash/pricing`,
      `${SITE_URL}/toggleslash`,
    ]);
  });

  test("no page asks crawlers to stay out", () => {
    for (const html of builtPages()) expect(html).not.toMatch(/<meta[^>]*name="robots"|noindex|nofollow/i);
  });

  test("the files that set response headers carry no robots tag", () => {
    expect(readFileSync(resolve(CLIENT, "_headers"), "utf8")).not.toMatch(/robots/i);
  });

  test("each real page has its own canonical address on the live site", () => {
    const canonical = (page: string): string | undefined =>
      readFileSync(resolve(CLIENT, page), "utf8").match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    expect(canonical("index.html")).toBe(`${SITE_URL}/`);
    expect(canonical("developers.html")).toBe(`${SITE_URL}/developers`);
  });
});
