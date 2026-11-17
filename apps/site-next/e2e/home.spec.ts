import { expect, test, type Page } from "@playwright/test";

/*
 * The home's hand-drawn hero in a real browser. With motion on, every piece of text in the panes' start
 * frame (the only part of the hero the motion changes) reads at 4.5:1 or more on the solid pane behind
 * it, in Slash Day and Slash Night. With reduced motion
 * the hero never moves. On Slash Day a tool card's mark is drawn in the tool's deep text tone even when
 * the system is dark, never in the pastel one.
 */

const THEMES = ["light", "dark"] as const;
const STORED = "hackcove:colour-scheme";

/**
 * Every visible text in the hero's panes, with its contrast on the ground behind it. Colours go through a
 * canvas, so any CSS colour syntax reads as sRGB; a background with alpha is laid over the one under
 * it, up to the page's own.
 */
const paneContrasts = (page: Page): Promise<{ text: string; ratio: number }[]> =>
  page.evaluate(() => {
    const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("no canvas");
    const rgba = (css: string): [number, number, number, number] => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0, a = 0] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a / 255];
    };
    const over = (top: number[], under: number[]): number[] =>
      [0, 1, 2].map((i) => (top[i] ?? 0) * (top[3] ?? 1) + (under[i] ?? 0) * (1 - (top[3] ?? 1)));
    const ground = (el: Element | null): number[] => {
      const layers: number[][] = [];
      for (let node = el; node; node = node.parentElement) {
        const c = rgba(getComputedStyle(node).backgroundColor);
        if (c[3] > 0) layers.push(c);
        if (c[3] === 1) break;
      }
      return layers.reduceRight<number[]>((under, top) => over(top, under), [255, 255, 255]);
    };
    const lum = (c: number[]): number => {
      const [r, g, b] = c.map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
    };
    const hero = document.querySelector(".panes");
    if (!hero) throw new Error("no panes");
    const out: { text: string; ratio: number }[] = [];
    const walker = document.createTreeWalker(hero, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const el = node.parentElement;
      const words = node.textContent?.trim() ?? "";
      if (!el || words === "" || el.closest("style, script, [aria-hidden='true']")) continue;
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      let hidden = false;
      for (let up: Element | null = el; up; up = up.parentElement) {
        if (Number(getComputedStyle(up).opacity) === 0) hidden = true;
      }
      if (hidden) continue;
      const fg = rgba(getComputedStyle(el).color);
      const bg = ground(el);
      const a = lum(over(fg, bg));
      const b = lum(bg);
      out.push({ text: words, ratio: Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100 });
    }
    return out;
  });

for (const theme of THEMES) {
  test(`with motion on, the panes' start frame reads at 4.5:1 or more in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
    // Held in the start frame: the island is up and `motion` is on, and `.played` (which the panes get
    // when they scroll into view) is kept off.
    await expect(page.locator("html")).toHaveClass(/\bmotion\b/);
    await page.evaluate(() => document.querySelector(".panes")?.classList.remove("played"));
    await expect(page.locator(".shop-btn")).toHaveCSS("margin-left", "0px");

    const readings = await paneContrasts(page);
    expect(readings.map((r) => r.text)).toEqual(expect.arrayContaining(["Pay", "+"]));
    expect(readings.filter((r) => r.ratio < 4.5)).toEqual([]);
  });
}

test("with reduced motion the hero stands still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(await page.locator("html").getAttribute("class")).not.toMatch(/\bmotion\b/);
  const panes = page.locator(".panes");
  const first = await panes.screenshot({ animations: "allow" });
  await page.waitForTimeout(1500);
  const second = await panes.screenshot({ animations: "allow" });
  expect(second.equals(first)).toBe(true);
});

test("on Slash Day a card's mark is the tool's deep tone, even on a dark system", async ({ page }, info) => {
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
