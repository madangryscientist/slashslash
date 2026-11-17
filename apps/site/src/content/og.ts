/**
 * Every page's share card: the image a chat app shows for a link to it. One entry per `PAGES` path.
 * design/logos (`og-pages.ts`, then `gen.py --og`) draws the cards from this list, and the layout's head names them.
 * The headline is the page's promise, taken from the content module that already holds it wherever one does.
 */
import { HERO } from "#/content/landing";
import { PAGES } from "#/content/pages";
import { PRODUCTS, type Product } from "#/content/products";
import { STATEMENT } from "#/pixelslash/content/pricing";

/** A tool's brand slug: its files in public/brand are `<tool>-mark.svg` and `<tool>-lockup-{light,dark}.svg`. */
export type OgTool = "slash" | "pixelslash" | "flakeslash" | "toggleslash" | "taskslash";

export type OgCard = {
  /** The page's path, as in `PAGES`. */
  path: string;
  /** The card's file name without `.png`: the path with `/` turned to `-`, and `slashslash` for `/`. */
  slug: string;
  /** Whose lockup and colour the card wears. */
  tool: OgTool;
  /** The words on the card. */
  headline: string;
  /** What the card shows, for og:image:alt. */
  alt: string;
};

/** The card's file name for a page path. */
export const ogSlug = (path: string): string => (path === "/" ? "slashslash" : path.slice(1).replaceAll("/", "-"));

const question = (name: Product["name"]): string => {
  const product = PRODUCTS.find((item) => item.name === name);
  if (product === undefined) throw new Error(`No product ${name}`);
  return product.question;
};

const LOCKUP: Record<OgTool, string> = {
  slash: "slashslash.build",
  pixelslash: "PixelSlash",
  flakeslash: "FlakeSlash",
  toggleslash: "ToggleSlash",
  taskslash: "TaskSlash",
};

/** The headline and tool of each page. Each typed headline is the words of that page's h1. */
const CARDS: Record<string, { tool: OgTool; headline: string }> = {
  "/": { tool: "slash", headline: HERO.title },
  "/developers": { tool: "slash", headline: "For developers" },
  "/flakeslash": { tool: "flakeslash", headline: question("FlakeSlash") },
  "/pixelslash": { tool: "pixelslash", headline: "See what your change did to the page." },
  "/pixelslash/compare": { tool: "pixelslash", headline: "How we compare" },
  "/pixelslash/how-it-works": { tool: "pixelslash", headline: "How it works" },
  "/pixelslash/pricing": { tool: "pixelslash", headline: STATEMENT },
  "/taskslash": { tool: "taskslash", headline: question("TaskSlash") },
  "/toggleslash": { tool: "toggleslash", headline: question("ToggleSlash") },
};

export const OG_CARDS: readonly OgCard[] = PAGES.map(({ path }) => {
  const card = CARDS[path];
  if (card === undefined) throw new Error(`No share card for ${path}`);
  return {
    path,
    slug: ogSlug(path),
    ...card,
    alt: `The ${LOCKUP[card.tool]} logo above the words: ${card.headline}`,
  };
});

/** The card a page wears. The 404 page, which is not in `PAGES`, wears the suite's. */
export function ogCardFor(path: string): OgCard {
  const card = OG_CARDS.find((item) => item.path === (path === "/404" ? "/" : path));
  if (card === undefined) throw new Error(`No share card for ${path}: add it to og.ts`);
  return card;
}

/** The share image's size in pixels. */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
