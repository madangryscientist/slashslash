import { expect, test } from "vitest";
import { resolveHref } from "#/pixelslash/doc/resolve-links";

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
  expect(resolveHref("docs/cli.md", "SECURITY.md")).toBe("https://github.com/slashsuite/pixelslash/blob/main/docs/cli.md");
});

test("anchors, mail and external links stay as they are", () => {
  expect(resolveHref("#on-your-own-box", "apps/web/SELF-HOST.md")).toBe("#on-your-own-box");
  expect(resolveHref("mailto:a@b.c", "SECURITY.md")).toBe("mailto:a@b.c");
  const advisories = "https://github.com/slashsuite/pixelslash/security/advisories/new";
  expect(resolveHref(advisories, "SECURITY.md")).toBe(advisories);
});
