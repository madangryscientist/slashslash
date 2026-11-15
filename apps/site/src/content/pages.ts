/**
 * Every real page on the site, in sitemap order: its public address (no trailing slash except the home page's) and its
 * source file under src/pages. The sitemap lists these and the tests read them; the 404 page is not a page here.
 * A test fails when a .astro page under src/pages is missing from this list.
 */
export const PAGES: readonly { path: string; file: string }[] = [
  { path: "/", file: "index.astro" },
  { path: "/developers", file: "developers.astro" },
  { path: "/flakeslash", file: "flakeslash.astro" },
  { path: "/pixelslash", file: "pixelslash/index.astro" },
  { path: "/pixelslash/compare", file: "pixelslash/compare.astro" },
  { path: "/pixelslash/how-it-works", file: "pixelslash/how-it-works.astro" },
  { path: "/pixelslash/pricing", file: "pixelslash/pricing.astro" },
  { path: "/toggleslash", file: "toggleslash.astro" },
];
