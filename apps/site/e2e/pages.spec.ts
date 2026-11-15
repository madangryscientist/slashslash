import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { PAGES } from "../src/content/pages.ts";

/*
 * Every page in the page list, in each theme, on a desktop and a phone: it answers 200 and loads,
 * never scrolls sideways on the phone, passes axe, and makes no request off the site.
 */

const THEMES = ["light", "dark"] as const;

for (const { path } of PAGES) {
  for (const theme of THEMES) {
    test(`${path} in ${theme}`, async ({ page, context, baseURL }, info) => {
      const origin = new URL(baseURL ?? "").origin;
      const leaked: string[] = [];
      // Registered first, so it runs after any stub: the site and local servers pass, the rest is caught.
      await context.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (url.origin === origin || url.hostname === "127.0.0.1") return route.fallback();
        leaked.push(url.href);
        return route.abort();
      });
      // Reduced motion: axe reads the settled page. With motion on, the reveals and the hero demo are
      // caught part way through a fade, and what axe finds depends on the frame it lands on.
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });

      const response = await page.goto(path, { waitUntil: "load" });
      expect(response?.status()).toBe(200);

      const axe = await new AxeBuilder({ page }).analyze();
      // One line per failing element, so the report says what failed and where.
      const violations = axe.violations.flatMap((v) =>
        v.nodes.map((n) => `${v.id}: ${n.target.join(" ")} (${n.any.map((c) => c.message).join("; ")})`),
      );
      expect(violations).toEqual([]);

      // Down one viewport at a time, so every lazy loader fires, then wait for the images to settle.
      // scrollBy, not mouse.wheel: it scrolls the same on a touch phone and a desktop.
      while (
        await page.evaluate(
          () => window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 1,
        )
      ) {
        const before = await page.evaluate(() => window.scrollY);
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await expect.poll(() => page.evaluate(() => window.scrollY)).not.toBe(before);
      }
      await expect
        .poll(() =>
          page.evaluate(() =>
            [...document.images].filter((i) => i.getClientRects().length > 0).every((i) => i.complete),
          ),
        )
        .toBe(true);
      expect(leaked).toEqual([]);

      // After the scroll, so lazy content that loaded on the way down counts too.
      if (info.project.name === "phone") {
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, "the page scrolls sideways").toBe(0);
      }
    });
  }
}
