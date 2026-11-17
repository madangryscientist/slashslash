import { expect, test } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NotFoundPage } from "../src/components/not-found.tsx";
import { BUILD_COMMIT_PATTERN } from "../src/content/build-commit.ts";

/*
 * After a deploy, against the live host (SMOKE_BASE_URL): the home page names the deployed commit in its
 * build-commit meta, and an unknown path answers a real 404 with the site's 404 page, not a 200 fallback.
 * The host has no redirect table, so there is no 301 check.
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

const EXPECT_COMMIT = process.env["SMOKE_EXPECT_COMMIT"];
/** How long an edge may keep serving the previous page after the upload before the check fails. */
const COMMIT_WAIT_MS = 120_000;

const buildCommitOf = (html: string): string | undefined =>
  /<meta name="build-commit" content="([^"]*)"/.exec(html)?.[1];

test("the home page names the commit it was built from", async ({ request }) => {
  test.setTimeout(COMMIT_WAIT_MS + 30_000);
  const deadline = Date.now() + (EXPECT_COMMIT ? COMMIT_WAIT_MS : 0);
  let seen: string | undefined;
  let status = 0;
  for (;;) {
    // A fresh query each time, so no cache answers with an older copy of the page. An error answer while
    // the edge switches over counts as not yet, like an older sha.
    const response = await request.get(`/?commit-check=${crypto.randomUUID()}`);
    status = response.status();
    seen = response.ok() ? buildCommitOf(await response.text()) : undefined;
    if (!EXPECT_COMMIT || seen === EXPECT_COMMIT || Date.now() >= deadline) break;
    await new Promise((done) => setTimeout(done, 5_000));
  }
  console.log(`build-commit on the home page: ${seen ?? "(none)"} (HTTP ${status})`);
  expect(status).toBe(200);
  expect(seen, "the home page has no build-commit meta").toBeDefined();
  expect(seen).toMatch(BUILD_COMMIT_PATTERN);
  if (EXPECT_COMMIT)
    expect(seen, `the live home page names ${seen}, not the deployed ${EXPECT_COMMIT}`).toBe(EXPECT_COMMIT);
});
