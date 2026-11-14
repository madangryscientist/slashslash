/**
 * Where a PixelSlash link goes. The marketing pages live here, under /pixelslash; the docs, the
 * self-host guide and the security page stay on pixelslash.dev for good, owned by the PixelSlash
 * repository. A path is the page's path on pixelslash.dev (`/pricing`), as the ported code names it.
 */
export const PIXELSLASH_DEV = "https://pixelslash.dev";

/** The pages this site serves under /pixelslash. SS-11 adds `/`, `/how-it-works` and `/compare`. */
export const LOCAL: readonly string[] = ["/pricing"];

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

/** The page's path on pixelslash.dev, from its address here: `/pixelslash/pricing` -> `/pricing`. */
export function sitePath(pathname: string): string {
  const path = pathname.replace(/\.html$/, "").replace(/\/+$/, "").replace(/^\/pixelslash/, "");
  return path === "" ? "/" : path;
}
