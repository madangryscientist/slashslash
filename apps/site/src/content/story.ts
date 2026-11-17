/**
 * The suite story: what Slash is for, in plain words, on the home page and on /developers. Plain
 * typed data, no markup. Pages render these strings as they are; the tests in story.test.ts hold the
 * rules (no counted tools, no dashes, no banned words, every tool in the right place), and every sentence
 * about a tool is a Claim that facts.test.ts holds to the tools' facts files.
 */

import type { Claim, FactId } from "#/content/facts";
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

/** What each of the four built tools is, for the claims about the suite as a whole. */
const SUITE: readonly [FactId, ...FactId[]] = [
  "taskslash/what-it-is",
  "flakeslash/what-it-is",
  "pixelslash/what-it-is",
  "toggleslash/what-it-is",
];

export const HERO: { title: Claim; lead: Claim } = {
  title: {
    text: "Your agents ship fast. Slash shows what each change really does, before it ships.",
    facts: SUITE,
  },
  lead: {
    text: "Agents now write a lot of the code, and nobody reads every line any more. The old checks were built for a person reading a person's work, and they let a lot slip through. Slash adds a tool at each step a change goes through, from the build to the release, so what a change really does shows up before your customers find it.",
    facts: SUITE,
  },
};

/** The title of the ask at the end of the home, where the questions are. */
export const VIEW = {
  title: "I would like your view",
} as const;

/** A step a change goes through, in the order most teams run them. */
type StageName = "Written" | "Built and tested" | "Reviewed" | "Released";

/** A step of the pipeline: its name, what happens there, and the tools that run there. */
type PipelineStage = {
  name: StageName;
  text: Claim;
  tools: readonly { tool: StoryTool; does: Claim }[];
};

/**
 * The one view of the suite: the steps a change goes through, in order, and under each step the tools
 * that run there, each with one sentence saying what it does. A planned tool says what it will do.
 */
export const PIPELINE: { title: string; lead: string; stages: readonly PipelineStage[]; next: Claim } = {
  title: "Where each tool fits",
  lead: "Most teams send a change through the same steps. Each Slash tool does one job at one of those steps, so you can start with the one that hurts most and leave the rest.",
  stages: [
    {
      name: "Written",
      text: {
        text: "An agent writes the change in minutes, and often touches more than a person would. Slash does not write code: it checks what the code does at each step after this one.",
        facts: SUITE,
      },
      tools: [],
    },
    {
      name: "Built and tested",
      text: {
        text: "The change is built and the automated tests run. A pass should mean the change works, not that the run got lucky.",
        facts: ["taskslash/what-it-is", "flakeslash/what-it-is"],
      },
      tools: [
        {
          tool: "TaskSlash",
          does: {
            text: "Queues builds and tests and starts each one when your computer has capacity, on one machine today and across your CI runners next, so a test fails because of the code, not because everything ran at once.",
            facts: ["taskslash/admission-by-capacity", "taskslash/ci-runners"],
          },
        },
        {
          tool: "FlakeSlash",
          does: {
            text: "Finds the checks that both failed and passed on the same commit, so a failure means something and is not just a reason to run it again.",
            facts: ["flakeslash/flake-same-commit"],
          },
        },
        {
          tool: "BundleSlash",
          does: {
            text: "Will measure how much code your customers download after each build, so a page cannot get slower to load one change at a time.",
            planned: "BundleSlash",
          },
        },
      ],
    },
    {
      name: "Reviewed",
      text: {
        text: "A person approves the change. They read the edited lines; Slash shows them what those lines do to the product.",
        facts: ["pixelslash/what-it-is"],
      },
      tools: [
        {
          tool: "PixelSlash",
          does: {
            text: "Takes screenshots of each page before and after the change and shows the reviewer every one that looks different, leaving out tiny differences nobody would notice.",
            facts: [
              "pixelslash/compare-two-urls",
              "pixelslash/many-pages",
              "pixelslash/perceptual-diff",
              "pixelslash/upload-to-review-app",
            ],
          },
        },
        {
          tool: "SightSlash",
          does: {
            text: "Will show each component in every state, not only the one someone happened to try.",
            planned: "SightSlash",
          },
        },
      ],
    },
    {
      name: "Released",
      text: {
        text: "The change goes live, to every customer at once or to some first.",
        facts: ["toggleslash/targeting"],
      },
      tools: [
        {
          tool: "ToggleSlash",
          does: {
            text: "Feature flags you run yourself: choose which customers get a feature, switch it off again without a new release, and keep a record of every switch.",
            facts: ["toggleslash/what-it-is", "toggleslash/targeting", "toggleslash/audit-trail"],
          },
        },
      ],
    },
  ],
  next: {
    text: "Next, what the tools find goes back to the agent that made the change, so it can fix its own work before a person has to look.",
    facts: ["pixelslash/mcp-server"],
  },
};

export const STANDS: { title: string; stages: Claim; tryLink: { text: string; href: string }; selfHost: Claim } = {
  title: "Where it stands",
  stages: {
    text: "TaskSlash, FlakeSlash, PixelSlash and ToggleSlash are alphas: try them and see what they do (start with how it works in CI). Expect the screens to change a lot, and expect bugs, which get fixed as they turn up. Between alpha versions, what the tools have stored (approvals, history, settings) may be reset. Your code and your customers' data are never touched. BundleSlash and SightSlash are planned.",
    facts: SUITE,
  },
  /** The words in `stages` that link to the CI walkthrough. */
  tryLink: { text: "how it works in CI", href: "/developers" },
  selfHost: {
    text: `${listNames(SELF_HOSTED)} run on your own server from one install, today on Proxmox or Kubernetes.`,
    facts: ["pixelslash/self-host-docker", "toggleslash/server-container"],
    repo: ["self-host/README.md", "self-host/proxmox", "self-host/chart", "self-host/pins/pixelslash.sha", "self-host/pins/toggleslash.sha"],
  },
};

export const DEVELOPERS: { title: string; next: Claim } = {
  title: "Built for working with agents",
  next: {
    text: "Next, point your agent at it and let it fix its own change first.",
    facts: ["pixelslash/mcp-server"],
  },
};

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
