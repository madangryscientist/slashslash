/**
 * /how-it-works: one cycle from an idea to merged code, as approved on 2026-11-20, word for word and in the
 * copy's order. The steps in words and the today and planned lists are in how-it-works-steps.ts. Every
 * sentence that says what a product does is a `Claim`, held to the facts files by facts.test.ts. The
 * roles, rules, `Next:` lines, headings, caption and legend are plain strings. Text in backticks is
 * inline code on the page, and [words](href) a link, both through `Rich`.
 */
import type { Claim } from "#/content/facts";
import { OMNISLASH_REPO_URL } from "#/content/site";

/** The page's h1, its title and its share card's headline. */
export const HOW_IT_WORKS_HEADLINE = "Idea to merged code, and what checks each step";

/** The page's meta description: the share card description. */
export const HOW_IT_WORKS_DESCRIPTION =
  "Steps from idea to merge have an agent role, a written skill where one steers it, and a Slash tool where one checks it; planned parts are marked planned.";

/** The two paragraphs under the h1. */
export const HOW_IT_WORKS_LEAD: readonly string[] = [
  "Every change here is built by one agent, then checked by another agent and by the Slash tools before it merges.",
  "One cycle, nine steps. Each step: its role, the skill that steers it where there is one, the Slash tool that checks its output where there is one. Solid means it runs today. Dashed means planned.",
];

/** A node of the diagram: one row of the copy's table. */
export type FlowNode = {
  /** The step's number, `5a` and `6a` for the branches off 5 and 6. */
  id: string;
  label: string;
  /** The Role and rule cell. */
  role: string;
  /** The Tool at this step cell: a claim, or a plain word when no tool acts. */
  tool: Claim | string;
  stage: "today" | "planned";
};

export const DIAGRAM: {
  title: string;
  nodes: readonly FlowNode[];
  caption: string;
} = {
  title: "The flow diagram",
  nodes: [
    { id: "1", label: "Idea", role: "The owner", tool: "None", stage: "today" },
    {
      id: "2",
      label: "Muse",
      role: "Muse. Skill: explore, hand over a design once confirmed",
      tool: { text: "OmniSlash: role inbox (`send`, `inbox`)", facts: ["omnislash/role-inbox"] },
      stage: "today",
    },
    {
      id: "3",
      label: "Drilled ticket",
      role: "Architect drills it",
      tool: {
        text: "OmniSlash: first dispatch of a ticket not tagged `spike` refused without `## Drilled`, a `## Done when` item and a recorded `go`",
        facts: ["omnislash/drilled-ticket-gate"],
      },
      stage: "today",
    },
    {
      id: "4",
      label: "Architect",
      role: "Architect. Skill: plan, drill, dispatch every build",
      tool: {
        text: "OmniSlash: `spinoff <ticket>`, leases on `ticket:` and `worktree:`",
        facts: ["omnislash/drilled-ticket-gate", "omnislash/leases"],
      },
      stage: "today",
    },
    {
      id: "5",
      label: "Builder, own worktree",
      role: "Builder, on the ticket's own branch",
      tool: {
        text: "OmniSlash: `git worktree add` from `origin/main`. TaskSlash: `taskslash moon <targets>`, admission by capacity. UISlash: components with no `className` or `style`",
        facts: [
          "omnislash/agent-build-worktree",
          "taskslash/moon-targets",
          "taskslash/admission-by-capacity",
          "uislash/no-styling-escape",
        ],
      },
      stage: "today",
    },
    {
      id: "5a",
      label: "Bundle size check",
      role: "Builder",
      tool: { text: "BundleSlash: compare two commits' JavaScript bundles locally, before CI", planned: "BundleSlash" },
      stage: "planned",
    },
    {
      id: "6",
      label: "Pull request",
      role: "Builder opens it, hands off",
      tool: {
        text: "PixelSlash: `pixelslash upload`, `status --wait`, flaky shot re-shoot. UISlash: review workflow, rule check fails the PR. FlakeSlash: dashboard scan every 10 minutes",
        facts: [
          "pixelslash/upload-to-review-app",
          "pixelslash/block-ci-on-review",
          "pixelslash/flaky-shot-detection",
          "uislash/ui-review-workflow",
          "flakeslash/dashboard-scan",
        ],
      },
      stage: "today",
    },
    {
      id: "6a",
      label: "Flake check on the PR",
      role: "None",
      tool: { text: "FlakeSlash: one non-blocking GitHub check per PR", facts: ["flakeslash/pr-check"] },
      stage: "planned",
    },
    {
      id: "7",
      label: "Sentinel's gate",
      role: "Sentinel. Skills: skeptical review, PR watch, land",
      tool: {
        text: "OmniSlash: handoff note delivered to the sentinel's inbox",
        facts: ["omnislash/role-inbox", "omnislash/role-delivery"],
      },
      stage: "today",
    },
    {
      id: "8",
      label: "Merge",
      role: "Sentinel, else architect. Never the builder",
      tool: { text: "OmniSlash: land skill", facts: ["omnislash/review-merge-skills"] },
      stage: "today",
    },
    {
      id: "9",
      label: "Release behind a flag",
      role: "Application code",
      tool: {
        text: "ToggleSlash: targeting, percentage rollout, live updates to SDKs",
        facts: ["toggleslash/targeting", "toggleslash/live-updates"],
      },
      stage: "today",
    },
  ],
  caption:
    "Solid: runs today. Dashed: planned. Each role's skill is the written rule it follows; each tool is the check on that step's work.",
};

/**
 * One tool in The tools: its name, its page here when it has one, and its line, which starts with the
 * name (the page shows the name in bold, linked to the page).
 */
export type FlowTool = { name: string; href?: string; line: Claim };

export const TOOLS: { title: string; tools: readonly FlowTool[] } = {
  title: "The tools",
  tools: [
    {
      name: "OmniSlash",
      href: "/omnislash",
      line: {
        text: "OmniSlash: command line tool tracking tickets, projects and the agents that work on them.",
        facts: ["omnislash/what-it-is"],
      },
    },
    {
      name: "TaskSlash",
      href: "/taskslash",
      line: {
        text: "TaskSlash: queues builds and tests until the computer has capacity for each.",
        facts: ["taskslash/what-it-is"],
      },
    },
    {
      name: "UISlash",
      line: {
        text: "UISlash: React components and themes a site is built from with props alone, never its own CSS.",
        facts: ["uislash/what-it-is"],
      },
    },
    {
      name: "PixelSlash",
      href: "/pixelslash",
      line: {
        text: "PixelSlash: shows what changed on a web page between Main and Branch; a person accepts or rejects each change.",
        facts: ["pixelslash/what-it-is"],
      },
    },
    {
      name: "FlakeSlash",
      href: "/flakeslash",
      line: {
        text: "FlakeSlash: finds tests that pass and fail on the same code, grouped into issues.",
        facts: ["flakeslash/what-it-is"],
      },
    },
    {
      name: "ToggleSlash",
      href: "/toggleslash",
      line: {
        text: "ToggleSlash: self-hosted feature flags, changed from a command line or dashboard while the app runs.",
        facts: ["toggleslash/what-it-is"],
      },
    },
    {
      name: "BundleSlash",
      line: { text: "BundleSlash (planned): bundle size between two commits.", planned: "BundleSlash" },
    },
  ],
};

/** The close: where to go next, and where the source is. */
export const CLOSE: { next: string; source: Claim; external: readonly string[] } = {
  next: "Next: [the home page](/), then each tool's page.",
  source: {
    text: `Source: OmniSlash at [github.com/slashsuite/omnislash](${OMNISLASH_REPO_URL}) (Elastic License 2.0, source available). UISlash and TaskSlash are MIT. PixelSlash, FlakeSlash and ToggleSlash are Elastic License 2.0. Docs: [hack-cove.com/ui](https://hack-cove.com/ui/) (UISlash), [slashslash.build/pixelslash/docs](/pixelslash/docs) (PixelSlash).`,
    facts: [
      "omnislash/public-repo",
      "omnislash/licence",
      "uislash/licence",
      "taskslash/licence",
      "pixelslash/licence",
      "flakeslash/licence",
      "toggleslash/licence",
      "uislash/docs-site",
      "pixelslash/docs-site",
    ],
  },
  external: [OMNISLASH_REPO_URL, "https://hack-cove.com/ui/"],
};
