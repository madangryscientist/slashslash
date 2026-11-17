import type { Claim } from "#/content/facts";

/**
 * Every page of the PixelSlash site, in nav order. This site serves four of them (paths.ts LOCAL); the rest
 * stay on pixelslash.dev, so only the four served here carry a description, a Claim citing PixelSlash's facts.
 */
export const PAGES: readonly { to: SitePath; label: string; title: string; description?: Claim }[] = [
  {
    to: "/",
    label: "Home",
    title: "PixelSlash: visual review for the web",
    description: {
      text: "PixelSlash diffs two versions of a page and shows what changed. Source available under the Elastic License 2.0, self-hostable.",
      facts: ["pixelslash/what-it-is", "pixelslash/licence", "pixelslash/self-host-docker", "pixelslash/self-host-cloudflare"],
    },
  },
  {
    to: "/how-it-works",
    label: "How it works",
    title: "How it works · PixelSlash",
    description: {
      text: "One PixelSlash run, step by step: capture Main and Branch, diff the pixels perceptually, and read the report it writes.",
      facts: ["pixelslash/compare-two-urls", "pixelslash/perceptual-diff", "pixelslash/compare-two-pngs"],
    },
  },
  {
    to: "/docs",
    label: "Docs",
    title: "Docs · PixelSlash",
  },
  {
    to: "/self-host",
    label: "Self-host",
    title: "Self-host · PixelSlash",
  },
  {
    to: "/compare",
    label: "Compare",
    title: "How we compare · PixelSlash",
    description: {
      text: "PixelSlash against five other visual testing tools, capability by capability, with the rows where it is behind left in.",
      facts: ["pixelslash/what-it-is"],
    },
  },
  {
    to: "/pricing",
    label: "Pricing",
    title: "Pricing · PixelSlash",
    description: {
      text: "PixelSlash is free and you can run all of it yourself. There is no paid plan to buy; the whole product is in the source-available repository.",
      facts: ["pixelslash/licence", "pixelslash/self-host-docker", "pixelslash/self-host-cloudflare", "pixelslash/from-source"],
    },
  },
  {
    to: "/security",
    label: "Security",
    title: "Security · PixelSlash",
  },
];

/** A PixelSlash page's path on pixelslash.dev. */
export type SitePath = "/" | "/how-it-works" | "/docs" | "/self-host" | "/compare" | "/pricing" | "/security";
