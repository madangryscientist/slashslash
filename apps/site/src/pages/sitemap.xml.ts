import type { APIRoute } from "astro";

// Every real page lives in src/pages as a .astro file; the 404 page is left out. The sitemap lists the
// pages' public addresses, with no trailing slash except the home page's. The PixelSlash pages under
// pixelslash/ are listed too: their canonical address is on this site.
const pages = Object.keys(import.meta.glob(["./*.astro", "./pixelslash/*.astro"]))
  .map((file) => file.replace(/^\.\//, "").replace(/\.astro$/, ""))
  .filter((name) => name !== "404")
  .map((name) => (name === "index" ? "" : `/${name.replace(/\/index$/, "")}`))
  .toSorted();

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error("astro.config.mjs must set `site`");
  const base = site.origin;
  const urls = pages.map((path) => `  <url><loc>${base}${path || "/"}</loc></url>`).join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { "Content-Type": "application/xml" } });
};
