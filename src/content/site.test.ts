import { existsSync, globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { PRODUCTS } from "#/content/products";
import { SITE_URL } from "#/content/site";

const CLIENT = resolve(import.meta.dirname, "../../dist");
const BUILT = resolve(CLIENT, "index.html");

function builtHtml(): string {
  if (!existsSync(BUILT))
    throw new Error(`No built page at ${BUILT}. Run the build first: bun run build.`);
  return readFileSync(BUILT, "utf8");
}

/** Every built page: the landing page, /developers and the 404 page. */
function builtPages(): string[] {
  builtHtml();
  const pages = globSync("**/*.html", { cwd: CLIENT });
  expect(pages.toSorted()).toEqual(["404.html", "developers/index.html", "index.html"]);
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
  test("every product has its status label next to its name on /developers", () => {
    builtHtml();
    const html = readFileSync(resolve(CLIENT, "developers/index.html"), "utf8");
    for (const product of PRODUCTS) {
      const label = new RegExp(`data-status-for="${product.name}"[^>]*>${product.status}<`);
      expect(html, `${product.name} should carry "${product.status}"`).toMatch(label);
    }
  });

  test("keeps out the words the brief rules out, and the comparisons nobody checked", () => {
    const forbidden =
      /salary|\bclients?\b|employer|job hunt|notice period|planner|spinoff|\bagents?\b|OB-\d+|192\.168|\.lan\b|\btokens?\b|Unleash|Flagsmith|GrowthBook|PostHog|Piranha|OpenFeature|LaunchDarkly MCP/i;
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
});

describe("is open to search engines", () => {
  test("robots.txt allows every crawler and names the sitemap", () => {
    expect(readFileSync(resolve(CLIENT, "robots.txt"), "utf8")).toBe(
      `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
    );
  });

  test("the sitemap lists both pages and not the 404 page", () => {
    const sitemap = readFileSync(resolve(CLIENT, "sitemap.xml"), "utf8");
    expect([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])).toEqual([
      `${SITE_URL}/`,
      `${SITE_URL}/developers`,
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
    expect(canonical("developers/index.html")).toBe(`${SITE_URL}/developers`);
  });
});
