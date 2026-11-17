import { expect, test } from "vitest";
import { PIXELSLASH_FILES } from "../../../site/scripts/fetch-sources.ts";

/*
 * The pin brings PixelSlash's data, images and font, never its look: a stylesheet or a component
 * fetched at the pinned commit would put the old pages' art back under the reskin. So every file the
 * fetch names is one of these kinds.
 */
const ALLOWED = [".json", ".png", ".svg", ".woff2", ".txt"];

test("every fetched PixelSlash file is data, an image, a font or a licence text", () => {
  const other = PIXELSLASH_FILES.filter((path) => !ALLOWED.some((ext) => path.endsWith(ext)));
  expect(other).toEqual([]);
});
