import { PAGES, type SitePath } from "#ps/content/pages";

/** A PixelSlash page's title and description, from the ported pages list, by its pixelslash.dev path. */
export function psPage(path: SitePath): { title: string; description: string } {
  const page = PAGES.find((item) => item.to === path);
  if (page === undefined) throw new Error(`No PixelSlash page ${path}`);
  return page;
}
