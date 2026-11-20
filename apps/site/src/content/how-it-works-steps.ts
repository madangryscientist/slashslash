/**
 * /how-it-works, its steps in words and its today and planned lists, as approved on 2026-11-20, word for
 * word and in the copy's order. The rest of the page is in how-it-works.ts. Every sentence that says what
 * a product does is a `Claim`, held to the facts files by facts.test.ts.
 */
import type { Claim } from "#/content/facts";

/** A run of a step's text: plain words, or a claim. Runs are shown one after another, a space between. */
export type Run = string | Claim;

/** One step in words: its bold title, its text, any list of checks, and the text after that list. */
export type FlowStep = {
  title: string;
  text: readonly Run[];
  checks?: readonly Claim[];
  after?: readonly Run[];
};

export const STEPS: { title: string; steps: readonly FlowStep[] } = {
  title: "The steps in words",
  steps: [
    { title: "1. Idea.", text: ["The owner has an idea.", "Next: the muse."] },
    {
      title: "2. Muse.",
      text: [
        "Role: muse. Rule: its skill says explore, then hand over a design once it is confirmed.",
        {
          text: "The handoff can go through OmniSlash's role inbox: `send <team> <role> \"<text>\"` stores the message, `inbox` lists it unread, oldest first.",
          facts: ["omnislash/role-inbox"],
        },
        "Next: the architect.",
      ],
    },
    {
      title: "3. Drilled ticket.",
      text: [
        "Role: architect.",
        {
          text: "Check: OmniSlash refuses the first dispatch, and queues nothing, when a ticket not tagged `spike` has no `## Drilled` section, no `## Done when` item, or no `go` check recorded on its current text. Override: `--no-check '<why>'`.",
          facts: ["omnislash/drilled-ticket-gate"],
        },
        "Next: dispatch.",
      ],
    },
    {
      title: "4. Architect.",
      text: [
        "Role: architect. Rule: its skill says plan, drill and dispatch every build, then gate and merge.",
        { text: "Command: `spinoff <ticket>`.", facts: ["omnislash/drilled-ticket-gate"] },
        {
          text: "Check: leases. One live holder per `ticket:<ref>` or `worktree:<path>`; a second holder is refused until release or expiry.",
          facts: ["omnislash/leases"],
        },
        "Next: a builder.",
      ],
    },
    {
      title: "5. Builder in its own worktree.",
      text: [
        "Role: builder.",
        {
          text: "Mechanism: OmniSlash reuses the worktree on the ticket's branch or runs `git worktree add <path> -b <branch>` from `origin/main`, then opens the builder as a T3 Code thread.",
          facts: ["omnislash/agent-build-worktree"],
        },
        "Checks while building:",
      ],
      checks: [
        {
          text: "TaskSlash: `taskslash moon <targets>` runs each target as one job, after its dependencies pass. A job starts when its estimated CPU, memory and disk writes fit what the machine has free. `taskslash run -- <command>` exits with the command's own exit code.",
          facts: ["taskslash/moon-targets", "taskslash/admission-by-capacity", "taskslash/run-command"],
        },
        {
          text: "UISlash: no exported component accepts `className` or `style`, so a page is built from props alone.",
          facts: ["uislash/no-styling-escape", "uislash/what-it-is"],
        },
        {
          text: "BundleSlash (planned): would compare the JavaScript bundles of two commits locally, before CI, for Bun, Vite and webpack builds.",
          planned: "BundleSlash",
        },
      ],
      after: ["Next: a pull request."],
    },
    {
      title: "6. Pull request.",
      text: ["Role: builder opens it and hands off. It does not merge. Checks:"],
      checks: [
        {
          text: "PixelSlash: `pixelslash upload` sends shots to the review app, which diffs them against the default branch. A person accepts or rejects each change (`a`, `r`). `pixelslash status --wait` holds the CI job until that decision. A changed shot is re-shot and flagged flaky when the shots disagree. `pixelslash mcp` lets a coding agent read builds and accept or reject a change.",
          facts: [
            "pixelslash/upload-to-review-app",
            "pixelslash/review-app-keyboard",
            "pixelslash/block-ci-on-review",
            "pixelslash/flaky-shot-detection",
            "pixelslash/mcp-server",
          ],
        },
        {
          text: "UISlash: a reusable GitHub workflow runs a rule check that fails the PR, plus an advisory model review.",
          facts: ["uislash/ui-review-workflow"],
        },
        {
          text: "FlakeSlash: the dashboard scans installed repos every 10 minutes. A job that failed and passed on the same commit is a flake; nothing else is.",
          facts: ["flakeslash/dashboard-scan", "flakeslash/flake-same-commit"],
        },
        {
          text: "FlakeSlash PR check (planned): one GitHub check per PR, never blocking, linking to the dashboard.",
          facts: ["flakeslash/pr-check"],
        },
      ],
      after: [
        "Next: the handoff note goes to the sentinel's inbox (the architect's when there is no sentinel). It never blocks the handoff.",
      ],
    },
    {
      title: "7. Sentinel's gate.",
      text: [
        "Role: sentinel. Rule: its skill says verify, merge and deploy every pull request.",
        {
          text: "Review skills: skeptical review (read-only reviewers presume every changed line is wrong), the PR watch, and land.",
          facts: ["omnislash/review-merge-skills"],
        },
        "Next: merge.",
      ],
    },
    {
      title: "8. Merge.",
      text: [
        "Role: sentinel, else architect. Rule: the land skill.",
        { text: "The builder opens the PR; another role gates and merges it.", facts: ["omnislash/review-merge-skills"] },
        "Next: release.",
      ],
    },
    {
      title: "9. Release behind a flag.",
      text: [
        "Tool: ToggleSlash.",
        {
          text: "A flag decides which users see which version: per environment, by key, by rule on context attributes, by segment, by prerequisite flag or by percentage.",
          facts: ["toggleslash/what-it-is", "toggleslash/targeting"],
        },
        { text: "SDKs get changes over a stream, with polling as fallback.", facts: ["toggleslash/live-updates"] },
        { text: "Every admin write is in the audit trail with before and after.", facts: ["toggleslash/audit-trail"] },
      ],
    },
  ],
};

/** Today and planned: the legend, then each list under its own heading. */
export const STATUS: {
  title: string;
  legend: string;
  todayTitle: string;
  today: readonly Claim[];
  plannedTitle: string;
  planned: readonly Claim[];
} = {
  title: "Today and planned",
  legend: 'Solid outline, runs today. Dashed outline and the word "planned", not built yet.',
  todayTitle: "Today",
  today: [
    {
      text: "OmniSlash: drilled-ticket gate, worktree per builder, leases, role skills, review and merge skills, role inbox, role runs (`send` starts one when the role has none). Alpha.",
      facts: [
        "omnislash/drilled-ticket-gate",
        "omnislash/agent-build-worktree",
        "omnislash/leases",
        "omnislash/role-skills",
        "omnislash/review-merge-skills",
        "omnislash/role-inbox",
        "omnislash/role-runs",
        "omnislash/role-delivery",
        "omnislash/what-it-is",
      ],
    },
    {
      text: "TaskSlash: daemon queue, admission by capacity, moon targets. Alpha, build from source with cargo.",
      facts: [
        "taskslash/daemon-queue",
        "taskslash/admission-by-capacity",
        "taskslash/moon-targets",
        "taskslash/what-it-is",
        "taskslash/no-release",
      ],
    },
    {
      text: "UISlash: React components with no styling escape, seven themes, PR review workflow. Version 0.x.",
      facts: [
        "uislash/react-components",
        "uislash/no-styling-escape",
        "uislash/seven-themes",
        "uislash/ui-review-workflow",
        "uislash/what-it-is",
      ],
    },
    {
      text: "PixelSlash: shot diff, review app, CI wait on review, flaky shot detection, MCP server. Alpha, CLI 0.7.",
      facts: [
        "pixelslash/compare-two-pngs",
        "pixelslash/upload-to-review-app",
        "pixelslash/block-ci-on-review",
        "pixelslash/flaky-shot-detection",
        "pixelslash/mcp-server",
        "pixelslash/what-it-is",
      ],
    },
    {
      text: "FlakeSlash: same-commit flake proof, dashboard scan. Alpha, CLI 0.1.0, runs from a checkout.",
      facts: [
        "flakeslash/flake-same-commit",
        "flakeslash/dashboard-scan",
        "flakeslash/what-it-is",
        "flakeslash/cli-not-on-npm",
      ],
    },
    {
      text: "ToggleSlash: self-hosted flag server, targeting, percentage rollout, live updates. Alpha, npm packages 0.1.0.",
      facts: ["toggleslash/server", "toggleslash/targeting", "toggleslash/live-updates", "toggleslash/what-it-is"],
    },
  ],
  plannedTitle: "Planned",
  planned: [
    {
      text: "OmniSlash: conflict checks between parallel builders; a team server with per-user access.",
      facts: ["omnislash/parallel-conflict-checks", "omnislash/team-server"],
    },
    {
      text: "TaskSlash: filter plugins on job output; scheduling across a pool of machines; scheduling for CI.",
      facts: ["taskslash/filter-plugins", "taskslash/machine-pool", "taskslash/ci-runners"],
    },
    { text: "UISlash: a React Native package.", facts: ["uislash/react-native"] },
    {
      text: "PixelSlash: one review across all of a project's subprojects.",
      facts: ["pixelslash/combined-subproject-review"],
    },
    {
      text: "FlakeSlash: a non-blocking check on each PR; a dashboard page per PR; `flakeslash upload`.",
      facts: ["flakeslash/pr-check", "flakeslash/pr-page", "flakeslash/upload"],
    },
    {
      text: "ToggleSlash: rollouts that raise the percentage in automatic steps; approvals before a change goes live; scheduled changes.",
      facts: ["toggleslash/progressive-rollouts", "toggleslash/approvals", "toggleslash/scheduled-changes"],
    },
    {
      text: "BundleSlash: measures how much code customers download after a change, comparing two commits' bundles locally before CI.",
      planned: "BundleSlash",
    },
  ],
};
