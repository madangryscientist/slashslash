import { expect, test } from "vitest";
import { resolveHref, resolveImageSrc } from "#/pixelslash/doc/resolve-links";

test("a document served here links to its page here", () => {
  expect(resolveHref("apps/web/SELF-HOST.md", "SECURITY.md")).toBe("/pixelslash/self-host");
  expect(resolveHref("../../SECURITY.md#what-is-in-scope", "apps/web/SELF-HOST.md")).toBe(
    "/pixelslash/security#what-is-in-scope",
  );
});

test("any other repository file goes to GitHub, resolved against the document's folder", () => {
  expect(resolveHref("README.md#self-host-in-5-minutes", "apps/web/SELF-HOST.md")).toBe(
    "https://github.com/slashsuite/pixelslash/blob/main/apps/web/README.md#self-host-in-5-minutes",
  );
  expect(resolveHref("docs/ci/README.md", "SECURITY.md")).toBe(
    "https://github.com/slashsuite/pixelslash/blob/main/docs/ci/README.md",
  );
  expect(resolveHref("/SECURITY.md", "apps/web/SELF-HOST.md")).toBe("/pixelslash/security");
});

test("anchors, mail and external links stay as they are", () => {
  expect(resolveHref("#on-your-own-box", "apps/web/SELF-HOST.md")).toBe("#on-your-own-box");
  expect(resolveHref("mailto:a@b.c", "SECURITY.md")).toBe("mailto:a@b.c");
  const advisories = "https://github.com/slashsuite/pixelslash/security/advisories/new";
  expect(resolveHref(advisories, "SECURITY.md")).toBe(advisories);
});

test("a docs file goes to its docs page, and the capability matrix to the compare page", () => {
  expect(resolveHref("../ci/review-server.md", "docs/tutorials/first-review.md")).toBe("/pixelslash/docs/ci-review-server");
  expect(resolveHref("docs/cli.md", "SECURITY.md")).toBe("/pixelslash/docs");
  expect(resolveHref("../capabilities/matrix.html", "docs/help/faq.md")).toBe("/pixelslash/compare");
});

test("a heading of docs/cli.md goes to the docs page that shows it", () => {
  expect(resolveHref("../cli.md#uploading-to-a-server", "docs/tutorials/first-review.md")).toBe(
    "/pixelslash/docs/upload#uploading-to-a-server",
  );
  expect(resolveHref("cli.md#exit-codes-and-the-failed-line", "docs/getting-started.md")).toBe(
    "/pixelslash/docs/signing-in#exit-codes-and-the-failed-line",
  );
  // Inside cli.md, an anchor on the page it sits on stays an anchor; one elsewhere leaves the page.
  expect(resolveHref("#uploading-to-a-server", "docs/cli.md", "upload")).toBe("#uploading-to-a-server");
  expect(resolveHref("#uploading-to-a-server", "docs/cli.md", "install")).toBe(
    "/pixelslash/docs/upload#uploading-to-a-server",
  );
  expect(() => resolveHref("cli.md#no-such-heading", "docs/getting-started.md")).toThrow(/no heading #no-such-heading/);
});

test("a file of PixelSlash's site is served from /pixelslash, and the index's page links go here", () => {
  expect(resolveHref("../apps/site/public/docs-images/gs-labelled.png", "docs/getting-started.md")).toBe(
    "/pixelslash/docs-images/gs-labelled.png",
  );
  expect(resolveImageSrc("../apps/site/public/docs-images/gs-labelled.png", "docs/getting-started.md")).toBe(
    "/pixelslash/docs-images/gs-labelled.png",
  );
  expect(resolveImageSrc("shot.png", "docs/getting-started.md")).toBeNull();
  expect(resolveHref("/docs/exit-codes", "docs/cli.md")).toBe("/pixelslash/docs/exit-codes");
});
