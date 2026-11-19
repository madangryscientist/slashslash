import { expect, test } from "vitest";
import { PIXELSLASH_FILES } from "../../scripts/fetch-sources.ts";

/*
 * The pin brings PixelSlash's data and images, never its look: a stylesheet, a component or a font
 * fetched at the pinned commit would put the old pages' art back under the Slash shell, which serves
 * its own Inter. So every file the fetch names is one of these kinds. A Markdown document brings words,
 * which the Slash shell renders in its own look, so it is allowed like data.
 */
const ALLOWED = [".json", ".png", ".md"];

test("every fetched PixelSlash file is data, an image or a document", () => {
  const other = PIXELSLASH_FILES.filter((path) => !ALLOWED.some((ext) => path.endsWith(ext)));
  expect(other).toEqual([]);
});
