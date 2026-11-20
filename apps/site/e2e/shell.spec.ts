import { expect, test } from "@playwright/test";
import { SECTIONS } from "../src/shell/sections.ts";

/*
 * The shell in a real browser, on the 404 page (the suite's section): the theme toggle switches the
 * scope on <html> and the choice survives a reload; with JavaScript off the page is Slash Day; and from
 * md the tool switcher is one row that never scrolls sideways.
 */

const PAGE = "/no-such-page";
const { day, night } = SECTIONS.suite;

/** The scope classes on <html> right now, of the two this section has. */
const scopes = (page: import("@playwright/test").Page): Promise<string[]> =>
  page.evaluate(
    ([a, b]) => [a, b].filter((c) => document.documentElement.classList.contains(c)),
    [day, night] as const,
  );

test("the toggle switches Slash Day and Slash Night, and the choice survives a reload", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "the toggle is the same on a phone; one run is enough");
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(PAGE);
  expect(await scopes(page)).toEqual([day]);

  const toggle = page.getByRole("button", { name: "Switch to dark theme" });
  await toggle.click();
  expect(await scopes(page)).toEqual([night]);
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();

  await page.reload();
  expect(await scopes(page)).toEqual([night]);

  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.reload();
  expect(await scopes(page)).toEqual([day]);
});

test("with JavaScript off the page is Slash Day", async ({ browser, baseURL }, info) => {
  test.skip(info.project.name !== "desktop", "no script runs either way; one run is enough");
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: "dark", baseURL: baseURL ?? "" });
  const page = await context.newPage();
  await page.goto(PAGE);
  expect(await page.locator("html").getAttribute("class")).toContain(day);
  expect((await page.locator("html").getAttribute("class"))?.split(/\s+/)).not.toContain(night);
  await expect(page.getByRole("navigation", { name: "Tools" }).first()).toBeVisible();
  await context.close();
});

for (const width of [768, 820, 1024, 1440]) {
  test(`at ${width}px the switcher is one row and nothing in the header scrolls sideways`, async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "the widths are set here; the phone folds the switcher into the Menu");
    await page.setViewportSize({ width, height: 900 });
    await page.goto(PAGE);
    const reading = await page.evaluate(() => {
      const nav = document.querySelector<HTMLElement>('header nav[aria-label="Tools"]');
      if (!nav) return undefined;
      const row = nav.closest<HTMLElement>("header > *");
      const tops = new Set([...nav.querySelectorAll("a")].map((a) => Math.round(a.getBoundingClientRect().top)));
      return {
        visible: nav.getClientRects().length > 0,
        rows: tops.size,
        nav: [nav.scrollWidth, nav.clientWidth],
        header: row ? [row.scrollWidth, row.clientWidth] : [],
        page: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
      };
    });
    expect(reading?.visible).toBe(true);
    expect(reading?.rows).toBe(1);
    expect(reading?.nav[0]).toBe(reading?.nav[1]);
    expect(reading?.header[0]).toBe(reading?.header[1]);
    expect(reading?.page[0]).toBe(reading?.page[1]);
  });
}
