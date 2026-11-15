import { createHash } from "node:crypto";
import { existsSync, globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { OG_CARDS, ogCardFor } from "#content/og";
import { SITE_URL } from "#content/site";

// The share cards: every built page names its own card, and the card is in the build at 1200x630.

const ROOT = resolve(import.meta.dirname, "..");
const DIST = resolve(ROOT, "dist");
const PUBLIC_OG = resolve(ROOT, "public/og");

/** Every built page, as its path: `404.html` is `/404`, `pixelslash/compare.html` is `/pixelslash/compare`. */
function builtPages(): { file: string; path: string }[] {
  if (!existsSync(DIST)) throw new Error(`No build at ${DIST}. Run "bunx moon run site-next:build" first.`);
  return globSync("**/*.html", { cwd: DIST }).map((file) => ({
    file,
    path: `/${file.replace(/\.html$/, "").replace(/(^|\/)index$/, "")}`.replace(/(.)\/$/, "$1"),
  }));
}

/** The content of the first meta tag with this property or name, attributes in any order. */
function meta(html: string, key: string): string | undefined {
  const tag = html.match(new RegExp(`<meta[^>]*(?:property|name)="${key}"[^>]*>`))?.[0] ?? "";
  return tag.match(/content="([^"]*)"/)?.[1];
}

const decode = (text: string | undefined): string | undefined =>
  text?.replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");

describe("share cards", () => {
  test("every built page names its own card, at 1200x630, with that card's alt", () => {
    const pages = builtPages();
    expect(pages.length).toBeGreaterThan(0);
    for (const { file, path } of pages) {
      const html = readFileSync(resolve(DIST, file), "utf8");
      const card = ogCardFor(path);
      const image = `${SITE_URL}/og/${card.slug}.png`;
      expect(meta(html, "og:image"), file).toBe(image);
      expect(meta(html, "og:image:width"), file).toBe("1200");
      expect(meta(html, "og:image:height"), file).toBe("630");
      expect(decode(meta(html, "og:image:alt")), file).toBe(card.alt);
      expect(meta(html, "twitter:card"), file).toBe("summary_large_image");
      expect(meta(html, "twitter:image"), file).toBe(image);
    }
  });

  test("the card each built page names is in dist/og as a 1200x630 PNG", () => {
    for (const { file, path } of builtPages()) {
      const png = resolve(DIST, "og", `${ogCardFor(path).slug}.png`);
      expect(existsSync(png), `${file}: ${png}`).toBe(true);
      const bytes = readFileSync(png);
      // A PNG's IHDR chunk holds its width and height as big-endian 32-bit numbers at bytes 16 and 20.
      expect(bytes.subarray(0, 8).toString("hex"), png).toBe("89504e470d0a1a0a");
      expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], png).toEqual([1200, 630]);
    }
  });

  test("every card in og.ts has its SVG and PNG committed, and nothing else is there", () => {
    const want = OG_CARDS.flatMap((card) => [`${card.slug}.png`, `${card.slug}.svg`]).toSorted();
    expect(globSync("*", { cwd: PUBLIC_OG }).toSorted()).toEqual(want);
  });

  test("each committed card was drawn from its current og.ts entry, and its PNG from that SVG", () => {
    for (const card of OG_CARDS) {
      // gen.py writes the entry's alt as the SVG's label, so a headline changed without a re-run shows here.
      const svg = readFileSync(resolve(PUBLIC_OG, `${card.slug}.svg`), "utf8");
      expect(decode(svg.match(/aria-label="([^"]*)"/)?.[1]), card.slug).toBe(card.alt);
      // og-png.ts writes the SVG's hash into the PNG, so a PNG not re-made after its SVG changed shows here.
      const png = readFileSync(resolve(PUBLIC_OG, `${card.slug}.png`));
      const hash = createHash("sha256").update(svg).digest("hex");
      expect(png.toString("latin1").match(/tEXtsvg-sha256\0([0-9a-f]{64})/)?.[1], `${card.slug}.png`).toBe(hash);
      expect([png.readUInt32BE(16), png.readUInt32BE(20)], `${card.slug}.png size`).toEqual([1200, 630]);
    }
  });
});
