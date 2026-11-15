import type { APIRoute } from "astro";
import { PAGES } from "#/content/pages";

// The sitemap lists the pages' public addresses from PAGES, the PixelSlash ones included: their canonical
// address is on this site.
export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error("astro.config.mjs must set `site`");
  const base = site.origin;
  const urls = PAGES.map(({ path }) => `  <url><loc>${base}${path}</loc></url>`).join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { "Content-Type": "application/xml" } });
};
