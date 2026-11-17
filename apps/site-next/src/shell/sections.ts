/**
 * The site's sections: the suite and each tool with a page. Each names the pair of @hackcove/themes
 * scopes its pages wear (light and dark), its mark, its home and, for a tool, its own pages for the
 * second header row. The shell, the layout and the head script read only this.
 */
import { FLAKESLASH_REPO_URL } from "#content/flakeslash";
import { PIXELSLASH_SITE_URL, SITE_NAME } from "#content/site";

export type SubPage = {
  label: string;
  href: string;
  /** A page on another site (the tool's docs), opened in a new tab. */
  external?: boolean;
};

export type Section = {
  /** The scope class on <html> in Slash Day (the light scheme) and in Slash Night (the dark one). */
  day: string;
  night: string;
  /** The 16 px mark, under public/. */
  mark: string;
  name: string;
  home: string;
  /** The tool's own pages, the header's second row. Empty for the suite. */
  pages: readonly SubPage[];
};

/** A product's mark by its name, under public/brand: every section and every product in PRODUCTS has one. */
export const markFor = (name: string): string => `/brand/${name.toLowerCase()}-mark.svg`;

export const SECTIONS = {
  suite: {
    day: "slash-suite",
    night: "slash-suite-dark",
    mark: "/brand/slash-mark.svg",
    name: SITE_NAME,
    home: "/",
    pages: [],
  },
  pixelslash: {
    // Becomes slash-pixelslash / slash-pixelslash-dark when @hackcove/themes ships slash-pixelslash.css.
    day: "slash-suite",
    night: "slash-suite-dark",
    mark: markFor("PixelSlash"),
    name: "PixelSlash",
    home: "/pixelslash",
    pages: [
      { label: "Overview", href: "/pixelslash" },
      { label: "How it works", href: "/pixelslash/how-it-works" },
      { label: "Compare", href: "/pixelslash/compare" },
      { label: "Pricing", href: "/pixelslash/pricing" },
      { label: "Docs", href: `${PIXELSLASH_SITE_URL}/docs`, external: true },
    ],
  },
  flakeslash: {
    // Becomes slash-flakeslash / slash-flakeslash-dark when @hackcove/themes ships slash-flakeslash.css.
    day: "slash-suite",
    night: "slash-suite-dark",
    mark: markFor("FlakeSlash"),
    name: "FlakeSlash",
    home: "/flakeslash",
    pages: [
      { label: "Overview", href: "/flakeslash" },
      { label: "Docs", href: `${FLAKESLASH_REPO_URL}/blob/main/docs/getting-started.md`, external: true },
    ],
  },
  toggleslash: {
    // Becomes slash-toggleslash / slash-toggleslash-dark when @hackcove/themes ships slash-toggleslash.css.
    day: "slash-suite",
    night: "slash-suite-dark",
    mark: markFor("ToggleSlash"),
    name: "ToggleSlash",
    home: "/toggleslash",
    pages: [{ label: "Overview", href: "/toggleslash" }],
  },
} as const satisfies Record<string, Section>;

export type SectionKey = keyof typeof SECTIONS;

/** The tools in the switcher, in its order: every section but the suite. */
export const TOOL_KEYS = ["pixelslash", "flakeslash", "toggleslash"] as const satisfies readonly Exclude<SectionKey, "suite">[];

