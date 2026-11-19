import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { GROUPS } from "../src/pixelslash/doc/docs-map.ts";

/*
 * PixelSlash's docs on the shell, in a real browser: the landing, a docs file with a screenshot, a cut
 * of docs/cli.md and the generated command index, in each theme at 1440px and on a 390px phone. Each
 * has the site's header and footer and every docs group, its previous and next pages answer, its
 * screenshots load, and it never scrolls sideways. A full-page shot of each is kept in
 * test-results/docs-shots for a person to look at.
 */

const PAGES = ["/pixelslash/docs", "/pixelslash/docs/getting-started", "/pixelslash/docs/upload", "/pixelslash/docs/cli"];
const THEMES = ["light", "dark"] as const;

for (const path of PAGES) {
  for (const theme of THEMES) {
    test(`${path} in ${theme}`, async ({ page, request }, info) => {
      const desktop = info.project.name === "desktop";
      if (desktop) await page.setViewportSize({ width: 1440, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      expect((await page.goto(path, { waitUntil: "load" }))?.status()).toBe(200);

      await expect(page.getByRole("banner")).toBeVisible();
      await expect(page.getByRole("contentinfo")).toBeAttached();

      await expect(page.locator('[data-testid="docs-nav"] [data-testid^="docs-group-"]')).toHaveCount(GROUPS.length);

      const neighbours = await page.locator('[data-testid="docs-prev"] a, [data-testid="docs-next"] a').evaluateAll((links) =>
        links.map((a) => a.getAttribute("href") ?? ""),
      );
      if (path !== "/pixelslash/docs") expect(neighbours.length).toBeGreaterThan(0);
      for (const href of neighbours) expect((await request.get(href)).status(), href).toBe(200);

      if (path.endsWith("/getting-started")) {
        const image = page.locator('img[src="/pixelslash/docs-images/gs-labelled.png"]');
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
      }

      if (!desktop) {
        expect(await page.evaluate(() => document.documentElement.scrollWidth), "the page scrolls sideways").toBeLessThanOrEqual(390);
      }

      await page.evaluate(() => window.scrollTo(0, 0));
      const name = `${path.split("/").at(-1)}-${theme}-${desktop ? 1440 : 390}`;
      await page.screenshot({ path: resolve(import.meta.dirname, `../test-results/docs-shots/${name}.png`), fullPage: true });
    });
  }
}
