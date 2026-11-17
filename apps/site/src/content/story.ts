/**
 * The suite story: what Slash is for, in plain words, on the home page and on /developers. Plain
 * typed data, no markup. Pages render these strings as they are; the tests in story.test.ts hold the
 * rules (no counted tools, no dashes, no banned words, every tool in the right place).
 */

import { PRODUCTS, type Product } from "#/content/products";

/** A tool the story names: every product on the site, plus SightSlash, which is planned and has no row yet. */
export type StoryTool = Product["name"] | "SightSlash";

/** The tools that run on the owner's own server from one install, today. One word changes when a tool joins the image. */
export const SELF_HOSTED: readonly Product["name"][] = ["PixelSlash", "ToggleSlash"];

/** Two names join with " and "; three or more join with ", " and a final ", and ". */
const listNames = (names: readonly string[]): string =>
  names.length <= 2
    ? names.join(" and ")
    : `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;

export const HERO = {
  title: "Your agents ship fast. Slash shows what each change really does, before it ships.",
  lead: "Agents now write a lot of the code, and nobody reads every line any more. The old checks were built for a person reading a person's work, and they let a lot slip through. Slash gives every change a plain report of what it will do, before your customers find out.",
} as const;

/** The title of the ask at the end of the home, where the questions are. */
export const VIEW = {
  title: "I would like your view",
} as const;

/** A step a change goes through, in the order most teams run them. */
type StageName = "Written" | "Built and tested" | "Reviewed" | "Released";

/** A step of the pipeline: its name, what happens there, and the tools that run there. */
type PipelineStage = {
  name: StageName;
  text: string;
  tools: readonly { tool: StoryTool; does: string }[];
};

/**
 * The one view of the suite: the steps a change goes through, in order, and under each step the tools
 * that run there, each with one sentence saying what it does. A planned tool says what it will do.
 */
export const PIPELINE: { title: string; lead: string; stages: readonly PipelineStage[]; next: string } = {
  title: "Where each tool fits",
  lead: "Most teams send a change through the same steps. Each Slash tool does one job at one of those steps, so you can start with the one that hurts most and leave the rest.",
  stages: [
    {
      name: "Written",
      text: "An agent writes the change in minutes, and often touches more than a person would. Slash does not write code: it checks what the code does at each step after this one.",
      tools: [],
    },
    {
      name: "Built and tested",
      text: "The change is built and the automated tests run. A green result should mean the change works, not that the run got lucky.",
      tools: [
        {
          tool: "TaskSlash",
          does: "Queues builds and tests on one machine and starts each only when there is room, so a test fails because of the code, not because everything ran at once.",
        },
        {
          tool: "FlakeSlash",
          does: "Finds the checks that both failed and passed on the same commit, so a red result means something and is not just a reason to run it again.",
        },
        {
          tool: "BundleSlash",
          does: "Will measure how much code your customers download after each build, so a page cannot grow heavy one change at a time.",
        },
      ],
    },
    {
      name: "Reviewed",
      text: "A person approves the change. They read the edited lines; Slash shows them what those lines do to the product.",
      tools: [
        {
          tool: "PixelSlash",
          does: "Takes screenshots of each page before and after the change and shows the reviewer every one that looks different, with harmless noise left out.",
        },
        {
          tool: "SightSlash",
          does: "Will show each component in every state, not only the one someone happened to try.",
        },
      ],
    },
    {
      name: "Released",
      text: "The change goes live, to every customer at once or to some first.",
      tools: [
        {
          tool: "ToggleSlash",
          does: "Feature flags you run yourself: choose which customers get a feature, switch it off again without a new release, and keep a record of every switch.",
        },
      ],
    },
  ],
  next: "Next, what the tools find goes back to the agent that made the change, so it can fix its own work before a person has to look.",
};

export const STANDS = {
  title: "Where it stands",
  stages:
    "PixelSlash, ToggleSlash, FlakeSlash and TaskSlash are alphas: try them and see what they do (start with how it works in CI). Expect the screens to change a lot, and expect bugs, which get fixed as they turn up. Between alpha versions, what the tools have stored (approvals, history, settings) may be reset. Your code and your customers' data are never touched. BundleSlash and SightSlash are planned.",
  /** The words in `stages` that link to the CI walkthrough. */
  tryLink: { text: "how it works in CI", href: "/developers" },
  selfHost: `${listNames(SELF_HOSTED)} run on your own server from one install, today on Proxmox or Kubernetes.`,
  hosted: "A hosted version, run for you, is planned. Pricing follows once running costs are known.",
} as const;

export const DEVELOPERS = {
  title: "Built for working with agents",
  today:
    "Your agents open pull requests all day. Slash gives each one a check that answers the questions a careful reviewer would have asked: what the page looks like, what switched on, whether the tests mean it, what it weighs, and how each component holds up in every state. Run it in CI today.",
  next: "Next, point your agent at it and let it fix its own change first.",
} as const;

export const VIEW_QUESTIONS = [
  "Has a change made by an agent ever surprised you or your customers?",
  "Which of these tools would you most want running on every change?",
  "Was anything on this page hard to follow?",
  "Would you want these tools together or separately?",
] as const;

/** The product names the story must place, for the tests: every PRODUCTS entry, then SightSlash. */
export const STORY_TOOLS: readonly StoryTool[] = [
  ...PRODUCTS.map((product) => product.name),
  "SightSlash",
];
