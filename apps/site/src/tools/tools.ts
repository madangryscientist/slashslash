/**
 * The tool homes the site builds, each read from its tool's content module: what the page says,
 * in the shape `ToolHome` takes. The pages differ only in this data.
 */
import type { Claim, FactsProduct } from "#/content/facts";
import * as flakeslash from "#/content/flakeslash";
import type { TryStep } from "#/content/flakeslash";
import * as omnislash from "#/content/omnislash";
import { PRODUCTS, type Product } from "#/content/products";
import { OMNISLASH_REPO_URL, TASKSLASH_REPO_URL, TOGGLESLASH_REPO_URL } from "#/content/site";
import * as taskslash from "#/content/taskslash";
import * as toggleslash from "#/content/toggleslash";
import { SECTIONS } from "#/shell/sections";

export type Tool = {
  /** Its section in SECTIONS, which is also the hero's id and the page's path. */
  key: "flakeslash" | "toggleslash" | "taskslash" | "omnislash";
  /** Its facts file, which the page's licence line reads. */
  facts: FactsProduct;
  /** The page title, and the promise after its colon. */
  title: Claim;
  description: Claim;
  lead: Claim;
  repo: string;
  /**
   * What works today. A feature's command, when it has one, is shown above its text; a list, when it has one, under
   * it. A word in backticks in a text is set as code.
   */
  today: readonly { title: string; command?: string; text: Claim; list?: readonly Claim[] }[];
  /** The try-it heading: what the reader tries it on. */
  tryOn: string;
  /** The try-it section: its lead, one copy block per step, and an optional paragraph after the blocks. */
  tryIt: { lead: Claim; steps: readonly TryStep[]; after?: Claim };
  planned: { lead: string; items: readonly Claim[] };
  links: readonly { label: string; href: string }[];
  /** The section headings, where a tool's copy names its own; the rest keep the defaults ToolHome sets. */
  headings?: { today?: string; tryIt?: string; planned?: string };
  /** A comparison with other tools, between what works today and what is planned. */
  compared?: { title: string; text: Claim };
  /** False when the hero shows no command: the copy has none. */
  heroCode?: false;
  /**
   * The licence in the copy's own words, shown after the try-it section in place of the hero's licence line, which
   * reads the facts file's words.
   */
  licence?: Claim;
};

export const TOOLS = {
  flakeslash: {
    key: "flakeslash",
    facts: "flakeslash",
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
    facts: "toggleslash",
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
  taskslash: {
    key: "taskslash",
    facts: "taskslash",
    title: taskslash.TASKSLASH_TITLE,
    description: taskslash.TASKSLASH_DESCRIPTION,
    lead: taskslash.TASKSLASH_INTRO.lead,
    repo: TASKSLASH_REPO_URL,
    today: taskslash.WORKS_TODAY,
    tryOn: "your own machine",
    tryIt: taskslash.TRY_IT,
    planned: {
      lead: "The README marks these as coming. None of them works yet.",
      items: taskslash.PLANNED,
    },
    links: taskslash.LINKS,
  },
  omnislash: {
    key: "omnislash",
    facts: "omnislash",
    title: omnislash.OMNISLASH_TITLE,
    description: omnislash.OMNISLASH_DESCRIPTION,
    lead: omnislash.OMNISLASH_INTRO.lead,
    repo: OMNISLASH_REPO_URL,
    today: omnislash.HOW_A_TICKET_MOVES,
    tryOn: "your own machine",
    tryIt: omnislash.TRY_IT,
    planned: { lead: omnislash.PLANNED_LEAD, items: omnislash.PLANNED },
    links: omnislash.LINKS,
    headings: {
      today: omnislash.HOW_A_TICKET_MOVES_TITLE,
      tryIt: omnislash.TRY_IT_TITLE,
      planned: omnislash.PLANNED_TITLE,
    },
    compared: omnislash.AGAINST,
    heroCode: false,
    licence: omnislash.LICENCE,
  },
} as const satisfies Record<Tool["key"], Tool>;

/** The promise, the hero's h1: the title after its colon, opening with a capital. */
export function promiseOf(tool: Tool): string {
  const promise = tool.title.text.split(": ")[1] ?? tool.title.text;
  return promise.charAt(0).toUpperCase() + promise.slice(1);
}

/** The tool's release stage, from PRODUCTS. */
export function stageOf(tool: Tool): Product["stage"] {
  const { name } = SECTIONS[tool.key];
  const product = PRODUCTS.find((p) => p.name === name);
  if (!product) throw new Error(`No product named ${name} in PRODUCTS.`);
  return product.stage;
}

/**
 * The hero's command: the last line of the try-it steps, the one that shows the tool at work. Undefined for a tool
 * whose hero shows no command.
 */
export function heroCommandOf(tool: Tool): string | undefined {
  if (tool.heroCode === false) return undefined;
  const last = tool.tryIt.steps.at(-1)?.commands.at(-1);
  if (last === undefined) throw new Error(`${tool.key}'s try-it has no command.`);
  return last;
}
