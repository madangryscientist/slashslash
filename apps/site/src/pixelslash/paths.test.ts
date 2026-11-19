import { expect, test } from "vitest";
import { psHref } from "#/pixelslash/paths";

test("the security page and the self-host guide are served here, and the docs still on pixelslash.dev", () => {
  expect(psHref("/security")).toBe("/pixelslash/security");
  expect(psHref("/self-host")).toBe("/pixelslash/self-host");
  expect(psHref("/")).toBe("/pixelslash");
  expect(psHref("/docs")).toBe("https://pixelslash.dev/docs");
});
