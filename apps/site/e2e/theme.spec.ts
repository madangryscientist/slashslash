import { expect, test } from "@playwright/test";
import { SCHEMES } from "../src/content/schemes.ts";

// The one behaviour the site has: the colour scheme toggle's choice survives a reload.
test("the toggle's scheme survives a reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveClass(new RegExp(`\\b${SCHEMES.light}\\b`));

  const toggle = page.getByRole("button", { name: "Switch to dark theme" });
  await toggle.click();
  await expect(html).toHaveClass(new RegExp(`\\b${SCHEMES.dark}\\b`));

  await page.reload();
  await expect(html).toHaveClass(new RegExp(`\\b${SCHEMES.dark}\\b`));
  await expect(html).not.toHaveClass(new RegExp(`\\b${SCHEMES.light}\\b`));
});
