/**
 * Where a PixelSlash link goes. The marketing pages live here, under /pixelslash; the docs, the
 * self-host guide and the security page stay on pixelslash.dev for good, owned by the PixelSlash
 * repository. A path is the page's path on pixelslash.dev (`/pricing`), as the ported code names it.
 */
export const PIXELSLASH_DEV = "https://pixelslash.dev";

/** The pages this site serves under /pixelslash. */
export const LOCAL: readonly string[] = ["/", "/how-it-works", "/compare", "/pricing"];

/** `/pricing` -> `/pixelslash/pricing` for a page here, else the page on pixelslash.dev. */
export function psHref(path: string): string {
  if (/^(#|mailto:|https?:)/.test(path)) return path;
  if (!LOCAL.includes(path)) return `${PIXELSLASH_DEV}${path}`;
  return path === "/" ? "/pixelslash" : `/pixelslash${path}`;
}

/** A file fetched into public/pixelslash: `/favicon.svg` -> `/pixelslash/favicon.svg`. */
export function psAsset(path: string): string {
  return `/pixelslash${path}`;
}

