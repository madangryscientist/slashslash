import { globSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { PAGES } from "#content/pages";

const PAGES_DIR = resolve(import.meta.dirname, "pages");

/** Every page this app builds, as its file under src/pages, but the not-found page. */
const builtPages = (): string[] =>
  globSync("**/*.astro", { cwd: PAGES_DIR })
    .filter((file) => file !== "404.astro")
    .toSorted();

describe("pages", () => {
  // Until the flip, this app holds a subset of the live pages: never one the live page list lacks.
  test("every page under src/pages is in PAGES", () => {
    const known = new Set(PAGES.map((page) => page.file));
    expect(builtPages().filter((file) => !known.has(file))).toEqual([]);
  });
});
