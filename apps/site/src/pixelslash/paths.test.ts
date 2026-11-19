import { expect, test } from "vitest";
import { psHref } from "#/pixelslash/paths";

test("every PixelSlash page is served here, the docs included", () => {
  expect(psHref("/security")).toBe("/pixelslash/security");
  expect(psHref("/self-host")).toBe("/pixelslash/self-host");
  expect(psHref("/")).toBe("/pixelslash");
  expect(psHref("/docs")).toBe("/pixelslash/docs");
  expect(psHref("/docs/upload#uploading-to-a-server")).toBe("/pixelslash/docs/upload#uploading-to-a-server");
  expect(psHref("/docs/judge")).toBe("/pixelslash/docs/judge");
});

test("a path no page here has stops the build instead of linking off-site", () => {
  expect(() => psHref("/blog")).toThrow(/No PixelSlash page \/blog/);
});
