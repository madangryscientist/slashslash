import { expect, test } from "vitest";
import { PIXELSLASH_FILES } from "../../scripts/fetch-sources.ts";

/*
 * The pin brings PixelSlash's data and images, never its look: a stylesheet, a component or a font
 * fetched at the pinned commit would put the old pages' art back under the Slash shell, which serves
 * its own Inter. So every file the fetch names is one of these kinds.
 */
const ALLOWED = [".json", ".png"];

test("every fetched PixelSlash file is data or an image", () => {
  const other = PIXELSLASH_FILES.filter((path) => !ALLOWED.some((ext) => path.endsWith(ext)));
  expect(other).toEqual([]);
});
