/**
 * Where a PixelSlash link goes. Every PixelSlash page lives here, under /pixelslash: the marketing
 * pages, the security page, the self-host guide and the docs. A path is the page's path as the ported
 * code names it (`/pricing`, `/docs/upload#uploading-to-a-server`).
 */

/** The pages this site serves under /pixelslash. */
export const LOCAL: readonly string[] = ["/", "/how-it-works", "/compare", "/pricing", "/security", "/self-host"];

/** `/docs` and every `/docs/...` path, its anchor kept: the docs pages, built from the docs map. */
const DOCS_PATH = /^\/docs(\/[a-z0-9-]+)?(#.*)?$/;

/** `/pricing` -> `/pixelslash/pricing`, `/docs/upload#x` -> `/pixelslash/docs/upload#x`. Any other path is a mistake. */
export function psHref(path: string): string {
  if (/^(#|mailto:|https?:)/.test(path)) return path;
  if (DOCS_PATH.test(path)) return `/pixelslash${path}`;
  if (!LOCAL.includes(path)) throw new Error(`No PixelSlash page ${path} is served here`);
  return path === "/" ? "/pixelslash" : `/pixelslash${path}`;
}

/** A file fetched into public/pixelslash: `/report.png` -> `/pixelslash/report.png`. */
export function psAsset(path: string): string {
  return `/pixelslash${path}`;
}

