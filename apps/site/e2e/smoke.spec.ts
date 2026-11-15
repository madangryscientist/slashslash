import { expect, test } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NotFoundPage } from "../src/components/not-found.tsx";

/*
 * After a deploy, against the live host (SMOKE_BASE_URL): an unknown path answers a real 404 with the
 * site's 404 page, not a 200 fallback. The host has no redirect table, so there is no 301 check.
 */

const h1 = (html: string): string | undefined => /<h1[^>]*>(.*?)<\/h1>/s.exec(html)?.[1];
const heading = h1(renderToStaticMarkup(createElement(NotFoundPage)));

test("an unknown path answers 404 with the site's 404 page", async ({ request }) => {
  expect(heading).toBeTruthy();
  const response = await request.get(`/no-such-page-${crypto.randomUUID()}`, { maxRedirects: 0 });
  expect(response.status()).toBe(404);
  // The h1 itself: the 404 page's <title> carries the same words.
  expect(h1(await response.text())).toBe(heading);
});
