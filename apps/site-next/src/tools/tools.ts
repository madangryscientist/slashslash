/**
 * The two tool homes this app builds, each read from its tool's content module: what the page says,
 * in the shape `ToolHome` takes. The pages differ only in this data.
 */
import * as flakeslash from "#content/flakeslash";
import { PRODUCTS, type Product } from "#content/products";
import { TOGGLESLASH_REPO_URL } from "#content/site";
import * as toggleslash from "#content/toggleslash";

export type TryStep = { lead: string; commands: readonly string[] };

export type Tool = {
  /** Its section in SECTIONS, which is also the hero's id and the page's path. */
  key: "flakeslash" | "toggleslash";
  name: Product["name"];
  /** The page title, and the promise after its colon. */
  title: string;
  description: string;
  lead: string;
  repo: string;
  today: readonly { title: string; command: string; text: string }[];
  /** The try-it heading: what the reader tries it on. */
  tryOn: string;
  tryIt: { lead: string; steps: readonly TryStep[] };
  planned: { lead: string; items: readonly string[] };
  links: readonly { label: string; href: string }[];
};

export const TOOLS = {
  flakeslash: {
    key: "flakeslash",
    name: "FlakeSlash",
    title: flakeslash.FLAKESLASH_TITLE,
    description: flakeslash.FLAKESLASH_DESCRIPTION,
    lead: flakeslash.FLAKESLASH_INTRO.lead,
    repo: flakeslash.FLAKESLASH_REPO_URL,
    today: flakeslash.WORKS_TODAY,
    tryOn: "your own repo",
    tryIt: flakeslash.TRY_IT,
    planned: {
      lead: "The design in the repository plans these. None of them works yet.",
      items: flakeslash.PLANNED,
    },
    links: flakeslash.LINKS,
  },
  toggleslash: {
    key: "toggleslash",
    name: "ToggleSlash",
    title: toggleslash.TOGGLESLASH_TITLE,
    description: toggleslash.TOGGLESLASH_DESCRIPTION,
    lead: toggleslash.TOGGLESLASH_INTRO.lead,
    repo: TOGGLESLASH_REPO_URL,
    today: toggleslash.WORKS_TODAY,
    tryOn: "your own machine",
    tryIt: toggleslash.TRY_IT,
    planned: {
      lead: "These are planned. None of them works yet.",
      items: toggleslash.PLANNED,
    },
    links: toggleslash.LINKS,
  },
} as const satisfies Record<Tool["key"], Tool>;

/** The promise, the hero's h1: the title after its colon, opening with a capital. */
export function promiseOf(tool: Tool): string {
  const promise = tool.title.split(": ")[1] ?? tool.title;
  return promise.charAt(0).toUpperCase() + promise.slice(1);
}

/** The tool's release stage, from PRODUCTS. */
export function stageOf(tool: Tool): Product["stage"] {
  const product = PRODUCTS.find((p) => p.name === tool.name);
  if (!product) throw new Error(`No product named ${tool.name} in PRODUCTS.`);
  return product.stage;
}
