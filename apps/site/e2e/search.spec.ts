import { type Page, expect, test } from "@playwright/test";
import { resolve } from "node:path";

/*
 * The docs search: the index is one static file on this site's own origin, queried in the browser.
 * Using the box asks for that file and for nothing else. The box is an island, so each test waits for
 * it to hydrate (Astro drops the island's `ssr` attribute once it has) before using it.
 */

const ERROR = 'has no "entries": needs Storybook 7 or later';

async function hydrated(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: "networkidle" });
  await expect(page.locator('astro-island[component-export="DocsSearch"]')).not.toHaveAttribute("ssr", { timeout: 10_000 });
}

test("search finds an exact error message, and the only request it makes is the index on this origin", async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? "").origin;
  await hydrated(page, "/pixelslash/docs/install");
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));

  const box = page.getByTestId("docs-search");
  await box.focus();
  await box.fill(ERROR);
  const first = page.getByTestId("docs-search-results").locator("a").first();
  await expect(first).toHaveAttribute("href", /^\/pixelslash\/docs\/troubleshooting#/);
  expect(requests).toEqual([`${origin}/pixelslash/search-index.json`]);

  await first.click();
  await page.waitForURL("**/pixelslash/docs/troubleshooting#*");
  const id = decodeURIComponent(new URL(page.url()).hash.slice(1));
  await expect(page.locator(`[id="${id}"]`)).toBeVisible();
});

test("a search for nothing says so", async ({ page }) => {
  await hydrated(page, "/pixelslash/docs/install");
  await page.getByTestId("docs-search").fill("zzzqqqxxx");
  await expect(page.getByTestId("docs-search-status")).toContainText("Nothing matches");
});

test("the search field has a decorative glass, and the hint names the key", async ({ page }) => {
  await hydrated(page, "/pixelslash/docs");
  const field = page.getByTestId("docs-search");
  // The kit's Icon is decorative on its wrapper (aria-hidden), and draws the glass inside it.
  const glassBox = page.getByRole("search").locator("[aria-hidden='true']:has(> svg)").first();
  await expect(glassBox).toBeVisible();
  await expect(glassBox.locator("svg")).toBeVisible();
  await expect(field).toHaveAccessibleName("Search the docs");
  await expect(field).toHaveAttribute("placeholder", "Search the docs (press /)");
});

test("the hint fits the field from lg up", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "a desktop-width layout check");
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await hydrated(page, "/pixelslash/docs");
    const fit = await page.evaluate(async () => {
      // Measure with Inter, not a fallback: wait for the page's fonts before reading the metrics.
      await document.fonts.ready;
      const input = document.querySelector<HTMLInputElement>('[data-testid="docs-search"]');
      if (!input) throw new Error("the docs search field is not on the page");
      const style = getComputedStyle(input);
      const context = document.createElement("canvas").getContext("2d");
      if (!context) throw new Error("no 2D canvas context");
      context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const textWidth = context.measureText(input.placeholder).width;
      const contentWidth = input.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      return { textWidth, contentWidth, placeholder: input.placeholder };
    });
    expect(fit.placeholder, `at ${width}px`).toBe("Search the docs (press /)");
    expect(fit.textWidth, `the hint at ${width}px needs ${fit.textWidth}px but the field has ${fit.contentWidth}px`).toBeLessThanOrEqual(fit.contentWidth);
  }
});

async function slashFocuses(page: Page, path: string): Promise<void> {
  await hydrated(page, path);
  const field = page.getByTestId("docs-search");
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await page.keyboard.press("/");
  await expect(field, path).toBeFocused();
  await expect(field, path).toHaveValue("");
}

test("/ focuses the search field on /pixelslash/docs and on a docs page", async ({ page }) => {
  await slashFocuses(page, "/pixelslash/docs");
  await slashFocuses(page, "/pixelslash/docs/install");
});

test("/ types into a text field, and Ctrl, Alt or Meta with it does nothing", async ({ page }) => {
  await slashFocuses(page, "/pixelslash/docs");
  const field = page.getByTestId("docs-search");
  await field.click();
  await page.keyboard.press("/");
  await expect(field).toHaveValue("/");

  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await page.keyboard.press("Control+/");
  await page.keyboard.press("Alt+/");
  await page.keyboard.press("Meta+/");
  await expect(field).not.toBeFocused();
});

/*
 * Where the box sits: at 1440px at the top of the docs nav, above "All docs"; on a 390px phone above
 * the page title, with the nav still after the page. A shot of each, before a query and with its results, is
 * kept in test-results/search-shots for a person to look at.
 */
for (const path of ["/pixelslash/docs", "/pixelslash/docs/upload"]) {
  for (const theme of ["light", "dark"] as const) {
    test(`the box's place on ${path} in ${theme}`, async ({ page }, info) => {
      const desktop = info.project.name === "desktop";
      if (desktop) await page.setViewportSize({ width: 1440, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await hydrated(page, path);

      const box = await page.getByTestId("docs-search").boundingBox();
      const allDocs = await page.getByTestId("docs-nav").getByRole("link", { name: "All docs" }).boundingBox();
      const title = await page.getByRole("heading", { level: 1 }).boundingBox();
      if (!box || !allDocs || !title) throw new Error("the box, the nav or the title is not laid out");
      expect(box.y + box.height, "the box is above All docs").toBeLessThan(allDocs.y);
      if (desktop) {
        expect(Math.abs(box.x - allDocs.x), "the box heads the nav column").toBeLessThan(24);
        expect(box.x + box.width, "the box is beside the page").toBeLessThan(title.x);
      } else {
        expect(box.y + box.height, "the box is above the page title").toBeLessThan(title.y);
        expect(allDocs.y, "the nav is after the page").toBeGreaterThan(title.y);
        expect(await page.evaluate(() => document.documentElement.scrollWidth), "the page scrolls sideways").toBeLessThanOrEqual(390);
      }

      const name = `${path.split("/").at(-1)}-${theme}-${desktop ? 1440 : 390}`;
      const shots = resolve(import.meta.dirname, "../test-results/search-shots");
      await page.screenshot({ path: `${shots}/${name}-place.png` });

      await page.getByTestId("docs-search").fill("baseline");
      await expect(page.getByTestId("docs-search-results").locator("a").first()).toBeVisible();
      if (!desktop) expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      await page.screenshot({ path: `${shots}/${name}-results.png` });
    });
  }
}
