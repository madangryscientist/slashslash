import type { APIRoute } from "astro";
import { buildSearchIndex } from "#/pixelslash/doc/search-index";

// One static file, written at build time and served from the site's own origin. The docs search
// fetches it; nothing else reads it.
export const GET: APIRoute = () => Response.json(buildSearchIndex());
