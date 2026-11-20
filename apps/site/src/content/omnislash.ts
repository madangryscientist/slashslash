/**
 * The /omnislash page, as plain data so a test can check it. Every word is the approved copy, transcribed as it was
 * written: change it only through new approved copy. A word in backticks is set as code, as the copy marks it; the
 * backticks themselves are not shown. Every product claim here cites OmniSlash's FACTS.md (facts.test.ts).
 */

import type { Claim } from "#/content/facts";
import type { TryStep } from "#/content/flakeslash";
import { OMNISLASH_REPO_URL } from "#/content/site";

/** The headline: the page's h1 and its share card. */
export const OMNISLASH_HEADLINE = "From an idea to a merged change, in one tool.";

/** The page title, its promise after the colon, as the other tool pages write theirs. */
export const OMNISLASH_TITLE: Claim = {
  text: "OmniSlash: from an idea to a merged change, in one tool.",
  facts: ["omnislash/what-it-is"],
};

export const OMNISLASH_INTRO: { title: string; lead: Claim } = {
  title: "OmniSlash",
  lead: {
    text: "OmniSlash (Omni for short) is a command-line tool that keeps track of tasks, projects and the agents that work on them. It will not let an agent start on a ticket nobody has thought through. It builds each ticket on its own branch, and has the pull request gated before it merges. It is built for agents from the start. It is in alpha, so anything may change or break.",
    facts: [
      "omnislash/what-it-is",
      "omnislash/drilled-ticket-gate",
      "omnislash/agent-build-worktree",
      "omnislash/review-merge-skills",
      "omnislash/role-skills",
    ],
  },
};

/** The page's description in search results and link previews: the lead's first sentence. */
export const OMNISLASH_DESCRIPTION: Claim = {
  text: "OmniSlash (Omni for short) is a command-line tool that keeps track of tasks, projects and the agents that work on them.",
  facts: ["omnislash/what-it-is"],
};

export type Step = {
  title: string;
  text: Claim;
  /** A list under the text, as the Three roles step has. */
  list?: readonly Claim[];
};

export const HOW_A_TICKET_MOVES_TITLE = "How a ticket moves";

/** How a ticket moves: what works today. */
export const HOW_A_TICKET_MOVES: readonly Step[] = [
  {
    title: "A drilled ticket.",
    text: {
      text: "You write the ticket. Before the first dispatch, it needs a `## Drilled` section, at least one `## Done when` item and a `go` check recorded on its current text. Without them, the dispatch is refused and nothing is queued. You can override the refusal with `--no-check` and a reason. A spike ticket has its own rule: it needs `## Questions`, `## Box`, `## Done when` and a link to the ticket it serves.",
      facts: ["omnislash/drilled-ticket-gate"],
    },
  },
  {
    title: "Its own branch.",
    text: {
      text: "A dispatch opens the builder in a git worktree on the ticket's own branch. If a worktree is already checked out on that branch, it reuses it. If not, it makes one from `origin/main`. The builder runs as a T3 Code thread.",
      facts: ["omnislash/agent-build-worktree"],
    },
  },
  {
    title: "Leases.",
    text: {
      text: "A lease on a ticket or a worktree has one holder at a time. A second holder is refused until the first releases it or the lease expires. Two agents cannot work the same ticket or the same worktree at once.",
      facts: ["omnislash/leases"],
    },
  },
  {
    title: "A gated merge.",
    text: {
      text: "The builder opens the pull request, and a different role gates and merges it. Read-only reviewers presume every changed line is wrong until they can show it is right. A watch follows the pull request once it is handed off.",
      facts: ["omnislash/review-merge-skills"],
    },
  },
  {
    title: "Three roles.",
    text: { text: "Agent skills prime a thread for each role.", facts: ["omnislash/role-skills"] },
    list: [
      {
        text: "Architect: plans, drills and dispatches every build, then gates and merges.",
        facts: ["omnislash/role-skills"],
      },
      { text: "Sentinel: verifies, merges and deploys every pull request.", facts: ["omnislash/role-skills"] },
      { text: "Muse: explores, and hands over a design once it is confirmed.", facts: ["omnislash/role-skills"] },
    ],
  },
];

export const AGAINST: { title: string; text: Claim } = {
  title: "Against Jira and Linear",
  text: {
    text: "OmniSlash refuses to dispatch a ticket that has no drilled section, no done-when item or no recorded check, unless you override it. The Jira and Linear docs name no such check before an agent takes the work.",
    facts: ["omnislash/drilled-ticket-gate", "omnislash/compared-jira", "omnislash/compared-linear"],
  },
};

export const PLANNED_TITLE = "Planned";
export const PLANNED_LEAD = "These are planned, not built.";

/** Planned, each item in the facts file's Planned list. */
export const PLANNED: readonly Claim[] = [
  {
    text: "Builders working in parallel are checked for conflicts with each other.",
    facts: ["omnislash/parallel-conflict-checks"],
  },
  { text: "A team server, with access per user.", facts: ["omnislash/team-server"] },
];

/** Try it: the lead, the two commands in one block, and what comes after them. */
export const TRY_IT: { lead: Claim; steps: readonly TryStep[]; after: Claim } = {
  lead: {
    text: "OmniSlash runs from a fresh clone on Linux with Bun 1.4.2:",
    facts: ["omnislash/checkout-linux"],
  },
  steps: [{ commands: ["bun install", "bun apps/cli/src/index.ts --help"] }],
  after: {
    text: "The second command prints the command reference. Postgres is the default store and needs a connection URL. To try it without Postgres, set `OMNISLASH_STORE=sqlite`, `OMNISLASH_DB_CREATE=1` and `OMNISLASH_DB` to a new path, then `add` and `list` work items in that file. Dispatching a builder needs T3 Code.",
    facts: ["omnislash/help-command", "omnislash/item-tracking", "omnislash/agent-build-worktree"],
  },
};

/** The licence, in the copy's words. */
export const LICENCE: Claim = {
  text: "OmniSlash is source available under the Elastic License 2.0.",
  facts: ["omnislash/licence"],
};

export const LINKS: readonly { label: string; href: string }[] = [
  { label: "Repository on GitHub", href: OMNISLASH_REPO_URL },
];
