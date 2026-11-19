import { PAGES, type SitePath } from "#/pixelslash/content/pages";

/** A PixelSlash page's title and description, from the ported pages list, by its path as the ported code names it. */
export function psPage(path: SitePath): { title: string; description: string } {
  const page = PAGES.find((item) => item.to === path);
  if (page?.description === undefined) throw new Error(`No PixelSlash page ${path} served here`);
  return { title: page.title, description: page.description.text };
}
