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
  title: "Your agents ship faster than anyone can check. Slash checks what they shipped.",
  lead: "Agents now write a lot of the code, and nobody reads every line any more. The old checks were built for a person reading a person's work, and they let a lot slip through. Slash gives every change a plain report of what it will do, before your customers find out.",
  actions: [
    { label: "I would like your view", href: "#your-view" },
    { label: "The tools", href: "#tools" },
  ],
} as const;

export const STEPS_TODAY = {
  title: "How a change reaches your customers today",
  steps: [
    { label: "Asked.", text: 'Someone asks for a change: "Add tax to the checkout total."' },
    { label: "Made.", text: "An agent makes it, in minutes. It edits more lines than a person would." },
    {
      label: "Approved.",
      text: "A person approves it. They skim the edited lines and trust that the rest is fine.",
    },
    {
      label: "Checked.",
      text: "Automated checks run. A green light means nothing that was tested broke.",
    },
    {
      label: "Live.",
      text: "It goes live. Your customers are the first to use the finished result.",
    },
  ],
} as const;

export const GAPS = {
  title: "What the old way got away with",
  lead: "These gaps were always there. A careful person used to cover them by hand. With agents making changes faster than anyone can look, they no longer get covered.",
  rows: [
    {
      where: "Approved",
      gap: "Nobody looks at the page. The approver sees edited lines, not what your customer will see.",
      tool: "PixelSlash",
    },
    {
      where: "Made",
      gap: "A small edit can switch on a feature nobody mentioned, and an agent will not mention it either.",
      tool: "ToggleSlash",
    },
    {
      where: "Checked",
      gap: "Some checks fail at random, so people learn to re-run until green, and agents learn it too.",
      tool: "FlakeSlash",
    },
    {
      where: "Live",
      gap: "The page gets heavier one change at a time, and no single change looks guilty.",
      tool: "BundleSlash",
    },
    {
      where: "Made",
      gap: "A component looks right in the state someone tried, and broken in the ones nobody did.",
      tool: "SightSlash",
    },
  ] satisfies readonly { where: string; gap: string; tool: StoryTool }[],
  close: "Today a person testing by hand before each release fills that gap. What they miss, customers find.",
} as const;

export const REPORT = {
  title: "One report on every change",
  body: "Every change arrives with a plain report of what it will do, on the change itself, where your team already approves work. Each Slash tool answers one question about the change, and the tools share one report, so nobody opens a pile of dashboards.",
  next: "Next, the same report goes back to the agent that made the change, so it can fix what it broke before anyone has to look.",
  rows: [
    {
      tool: "PixelSlash",
      question: "Does the page look different?",
      why: "Nobody reads every line, so somebody has to look at the result.",
    },
    {
      tool: "ToggleSlash",
      question: "What switches on, and for whom?",
      why: "An agent can flip a switch in passing.",
    },
    {
      tool: "FlakeSlash",
      question: "Can the test results be trusted?",
      why: "Agents re-run a red check until it goes green.",
    },
    {
      tool: "BundleSlash",
      question: "Did the app get heavier to load?",
      why: "Weight creeps in a little with every quick change.",
    },
    {
      tool: "SightSlash",
      question: "What does each component look like, in every state?",
      why: "An agent tries the happy path and stops.",
    },
  ] satisfies readonly { tool: StoryTool; question: string; why: string }[],
  close: "Step 3 becomes: a person approves it, having seen what customers will see. Step 4 gains a check that says what the change does, not only whether something broke.",
} as const;

export const STANDS = {
  title: "Where it stands",
  stages:
    "PixelSlash works today and runs inside a team's existing checks. ToggleSlash and FlakeSlash are in alpha. BundleSlash and SightSlash are planned.",
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
  "Which of these questions would you most want answered on every change?",
  "Was anything on this page hard to follow?",
  "Would you want these tools together or separately?",
] as const;

/** The product names the story must place, for the tests: every PRODUCTS entry, then SightSlash. */
export const STORY_TOOLS: readonly StoryTool[] = [
  ...PRODUCTS.map((product) => product.name),
  "SightSlash",
];
