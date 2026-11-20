import { expect, test, type Page } from "@playwright/test";
import { HERO } from "../src/content/landing.ts";

/*
 * The home's hand-drawn hero in a real browser. With motion on, every piece of text in the panes' start
 * frame (the only part of the hero the motion changes) and in its finished drawing reads at 4.5:1 or
 * more on the solid pane behind it, in Slash Day and Slash Night. With reduced motion
 * the hero never moves. On Slash Day a tool card's mark is drawn in the tool's deep text tone even when
 * the system is dark, never in the pastel one.
 */

const THEMES = ["light", "dark"] as const;
const STORED = "hackcove:colour-scheme";

type Rgba = [number, number, number, number];
/**
 * One text in the panes, with its box's area, whether it sits in a style, script or svg, its colour and
 * each element from it up to the root, as CSS.
 */
type RawText = {
  text: string;
  area: number;
  inert: boolean;
  color: string;
  layers: { background: string; opacity: string }[];
};

/** Every text in the hero's panes, with the CSS colours its contrast is worked out from. */
const paneTexts = (page: Page): Promise<RawText[]> =>
  page.evaluate(() => {
    const hero = document.querySelector(".panes");
    if (!hero) throw new Error("no panes");
    const out: RawText[] = [];
    const walker = document.createTreeWalker(hero, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const el = node.parentElement;
      if (!el) continue;
      const box = el.getBoundingClientRect();
      const layers: RawText["layers"] = [];
      for (let up: Element | null = el; up; up = up.parentElement) {
        const style = getComputedStyle(up);
        layers.push({ background: style.backgroundColor, opacity: style.opacity });
      }
      out.push({
        text: node.textContent?.trim() ?? "",
        area: box.width * box.height,
        inert: el.closest("style, script, svg") !== null,
        color: getComputedStyle(el).color,
        layers,
      });
    }
    return out;
  });

/** Each CSS colour as sRGB with alpha 0 to 1. A canvas reads them, so any CSS colour syntax works. */
const toRgba = (page: Page, colours: string[]): Promise<Rgba[]> =>
  page.evaluate((css) => {
    const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("no canvas");
    return css.map((colour): Rgba => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillStyle = colour;
      ctx.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0, a = 0] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a / 255];
    });
  }, colours);

/** A colour with alpha laid over an opaque one. */
const over = (top: Rgba, under: Rgba): Rgba => [
  top[0] * top[3] + under[0] * (1 - top[3]),
  top[1] * top[3] + under[1] * (1 - top[3]),
  top[2] * top[3] + under[2] * (1 - top[3]),
  1,
];

/** The ground behind a text: each background with alpha laid over the one under it, up to the first opaque one or white. */
function ground(backgrounds: Rgba[]): Rgba {
  const opaque = backgrounds.findIndex((c) => c[3] === 1);
  const layers = opaque === -1 ? backgrounds : backgrounds.slice(0, opaque + 1);
  return layers.reduceRight<Rgba>((under, top) => (top[3] > 0 ? over(top, under) : under), [255, 255, 255, 1]);
}

const channel = (v: number): number => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = (c: Rgba): number => 0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2]);

/** The WCAG contrast of a text colour on its ground, to two decimals. */
function contrast(fg: Rgba, bg: Rgba): number {
  const a = lum(over(fg, bg));
  const b = lum(bg);
  return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100;
}

/** A text a reader sees: words in a box with an area, outside style, script and svg, with no ancestor at opacity 0. */
const visible = (t: RawText): boolean =>
  t.text !== "" && t.area > 0 && !t.inert && t.layers.every((l) => Number(l.opacity) !== 0);

/** Every visible text in the hero's panes, with its contrast on the ground behind it. */
async function paneContrasts(page: Page): Promise<{ text: string; ratio: number }[]> {
  const shown = (await paneTexts(page)).filter(visible);
  const colours = [...new Set(shown.flatMap((t) => [t.color, ...t.layers.map((l) => l.background)]))];
  const rgba = new Map((await toRgba(page, colours)).map((c, i) => [colours[i], c]));
  const of = (css: string): Rgba => rgba.get(css) ?? [0, 0, 0, 0];
  return shown.map((t) => ({ text: t.text, ratio: contrast(of(t.color), ground(t.layers.map((l) => of(l.background)))) }));
}

for (const theme of THEMES) {
  test(`with motion on, the panes' start frame reads at 4.5:1 or more in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
    // Held in the start frame: the island is up and `motion` is on, and `.played` (which the panes get
    // when they scroll into view) is kept off.
    await expect(page.locator("html")).toHaveClass(/\bmotion\b/);
    await page.evaluate(() => document.querySelector(".panes")?.classList.remove("played"));
    await expect(page.locator(".pane-after .shop-btn")).toHaveCSS("margin-left", "0px");

    const readings = await paneContrasts(page);
    expect(readings.map((r) => r.text)).toEqual(expect.arrayContaining(["Pay", "+"]));
    expect(readings.filter((r) => r.ratio < 4.5)).toEqual([]);
  });

  test(`the finished hero reads at 4.5:1 or more in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/");
    const readings = await paneContrasts(page);
    expect(readings.map((r) => r.text)).toEqual(
      expect.arrayContaining(["Before", "The change", "After", "Tax", HERO.asked, HERO.notAsked, "Pay"]),
    );
    expect(readings.filter((r) => r.ratio < 4.5)).toEqual([]);
  });
}

test("with reduced motion the hero stands still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Tall enough that the three stacked panes fit on a phone: a shot taller than the window scrolls,
  // and the sticky header lands on it differently each time.
  const width = page.viewportSize()?.width ?? 390;
  await page.setViewportSize({ width, height: 2000 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(await page.locator("html").getAttribute("class")).not.toMatch(/\bmotion\b/);
  const panes = page.locator(".panes");
  // Chromium's first capture after load can raster text a shade apart from the next one when the
  // pipeline's cards share the tall window. That is not motion, so one shot is taken and dropped first.
  await panes.screenshot({ animations: "allow" });
  const first = await panes.screenshot({ animations: "allow" });
  await page.waitForTimeout(1500);
  const second = await panes.screenshot({ animations: "allow" });
  expect(second.equals(first)).toBe(true);
});

test("on Slash Day a tool's mark is its deep tone, even on a dark system", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "the mark is the same image on a phone");
  await page.addInitScript((key) => localStorage.setItem(key, "light"), STORED);
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  const mark = page.locator('[data-tool="PixelSlash"] img');
  await mark.scrollIntoViewIfNeeded();
  const shot = (await mark.screenshot()).toString("base64");
  // The mark's most saturated pixel, read back through a canvas.
  const pixel = await page.evaluate(async (png) => {
    const img = new Image();
    img.src = `data:image/png;base64,${png}`;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let best = [0, 0, 0];
    let spread = -1;
    for (let i = 0; i < d.length; i += 4) {
      const p = [d[i] ?? 0, d[i + 1] ?? 0, d[i + 2] ?? 0];
      const s = Math.max(...p) - Math.min(...p);
      if (s > spread) [best, spread] = [p, s];
    }
    return best;
  }, shot);
  // PixelSlash's deep tone is #8839ef; its pastel #cba6f7 would read near 203.
  expect(pixel[0]).toBeLessThan(160);
});
