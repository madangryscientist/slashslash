import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

/*
 * The approved copy for /how-it-works (2026-11-20), typed here word for word and read against the built
 * page (`bunx moon run site:test` builds first). It does not import the content module, so a word changed
 * there fails here. Text in backticks is inline code on the page.
 */

const DIST = resolve(import.meta.dirname, "../../dist");

function html(): string {
  const path = resolve(DIST, "how-it-works.html");
  if (!existsSync(path)) throw new Error(`No built page at ${path}. Run the build first: bunx moon run site:build.`);
  return readFileSync(path, "utf8");
}

/** Escapes undone, spaces folded. */
function unescape(text: string): string {
  return text
    .replaceAll("&#39;", "'")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** The page's visible body text: tags and scripts dropped, escapes undone, spaces folded. */
function words(page: string): string {
  // From the body on: the head's title repeats the headline, and must not stand in for the h1.
  return unescape(
    page
      .slice(page.indexOf("<body"))
      .replace(/<(script|style|template)[\s\S]*?<\/\1>/g, " ")
      // Code spans and links sit inside a sentence, so their tags add no space; other closing inline tags neither.
      .replace(/<\/?(a|code)\b[^>]*>/g, "")
      .replace(/<\/(span|strong|em)>/g, "")
      .replace(/<[^>]+>/g, " "),
  );
}

/** The en dash and the em dash, written by code point so this file carries neither. */
const LONG_DASHES = new RegExp(`[${String.fromCodePoint(0x2013, 0x2014)}]`);

const HEADLINE = "Idea to merged code, and what checks each step";
const DESCRIPTION =
  "Steps from idea to merge have an agent role, a written skill where one steers it, and a Slash tool where one checks it; planned parts are marked planned.";

const LEAD = [
  "Every change here is built by one agent, then checked by another agent and by the Slash tools before it merges.",
  "One cycle, nine steps. Each step: its role, the skill that steers it where there is one, the Slash tool that checks its output where there is one. Solid means it runs today. Dashed means planned.",
];

/** The diagram's rows: number, node label, role and rule, tool at this step. */
const NODES: [string, string, string, string][] = [
  ["1", "Idea", "The owner", "None"],
  ["2", "Muse", "Muse. Skill: explore, hand over a design once confirmed", "OmniSlash: role inbox (`send`, `inbox`)"],
  ["3", "Drilled ticket", "Architect drills it", "OmniSlash: first dispatch of a ticket not tagged `spike` refused without `## Drilled`, a `## Done when` item and a recorded `go`"],
  ["4", "Architect", "Architect. Skill: plan, drill, dispatch every build", "OmniSlash: `spinoff <ticket>`, leases on `ticket:` and `worktree:`"],
  ["5", "Builder, own worktree", "Builder, on the ticket's own branch", "OmniSlash: `git worktree add` from `origin/main`. TaskSlash: `taskslash moon <targets>`, admission by capacity. UISlash: components with no `className` or `style`"],
  ["5a", "Bundle size check", "Builder", "BundleSlash: compare two commits' JavaScript bundles locally, before CI"],
  ["6", "Pull request", "Builder opens it, hands off", "PixelSlash: `pixelslash upload`, `status --wait`, flaky shot re-shoot. UISlash: review workflow, rule check fails the PR. FlakeSlash: dashboard scan every 10 minutes"],
  ["6a", "Flake check on the PR", "None", "FlakeSlash: one non-blocking GitHub check per PR"],
  ["7", "Sentinel's gate", "Sentinel. Skills: skeptical review, PR watch, land", "OmniSlash: handoff note delivered to the sentinel's inbox"],
  ["8", "Merge", "Sentinel, else architect. Never the builder", "OmniSlash: land skill"],
  ["9", "Release behind a flag", "Application code", "ToggleSlash: targeting, percentage rollout, live updates to SDKs"],
];
const PLANNED_NODES = new Set(["5a", "6a"]);

/** Everything after the diagram's rows, in order. */
const REST = [
  "Solid: runs today. Dashed: planned. Each role's skill is the written rule it follows; each tool is the check on that step's work.",
  "The steps in words",
  "1. Idea. The owner has an idea. Next: the muse.",
  "2. Muse. Role: muse. Rule: its skill says explore, then hand over a design once it is confirmed. The handoff can go through OmniSlash's role inbox: `send <team> <role> \"<text>\"` stores the message, `inbox` lists it unread, oldest first. Next: the architect.",
  "3. Drilled ticket. Role: architect. Check: OmniSlash refuses the first dispatch, and queues nothing, when a ticket not tagged `spike` has no `## Drilled` section, no `## Done when` item, or no `go` check recorded on its current text. Override: `--no-check '<why>'`. Next: dispatch.",
  "4. Architect. Role: architect. Rule: its skill says plan, drill and dispatch every build, then gate and merge. Command: `spinoff <ticket>`. Check: leases. One live holder per `ticket:<ref>` or `worktree:<path>`; a second holder is refused until release or expiry. Next: a builder.",
  "5. Builder in its own worktree. Role: builder. Mechanism: OmniSlash reuses the worktree on the ticket's branch or runs `git worktree add <path> -b <branch>` from `origin/main`, then opens the builder as a T3 Code thread. Checks while building:",
  "TaskSlash: `taskslash moon <targets>` runs each target as one job, after its dependencies pass. A job starts when its estimated CPU, memory and disk writes fit what the machine has free. `taskslash run -- <command>` exits with the command's own exit code.",
  "UISlash: no exported component accepts `className` or `style`, so a page is built from props alone.",
  "BundleSlash (planned): would compare the JavaScript bundles of two commits locally, before CI, for Bun, Vite and webpack builds.",
  "Next: a pull request.",
  "6. Pull request. Role: builder opens it and hands off. It does not merge. Checks:",
  "PixelSlash: `pixelslash upload` sends shots to the review app, which diffs them against the default branch. A person accepts or rejects each change (`a`, `r`). `pixelslash status --wait` holds the CI job until that decision. A changed shot is re-shot and flagged flaky when the shots disagree. `pixelslash mcp` lets a coding agent read builds and accept or reject a change.",
  "UISlash: a reusable GitHub workflow runs a rule check that fails the PR, plus an advisory model review.",
  "FlakeSlash: the dashboard scans installed repos every 10 minutes. A job that failed and passed on the same commit is a flake; nothing else is.",
  "FlakeSlash PR check (planned): one GitHub check per PR, never blocking, linking to the dashboard.",
  "Next: the handoff note goes to the sentinel's inbox (the architect's when there is no sentinel). It never blocks the handoff.",
  "7. Sentinel's gate. Role: sentinel. Rule: its skill says verify, merge and deploy every pull request. Review skills: skeptical review (read-only reviewers presume every changed line is wrong), the PR watch, and land. Next: merge.",
  "8. Merge. Role: sentinel, else architect. Rule: the land skill. The builder opens the PR; another role gates and merges it. Next: release.",
  "9. Release behind a flag. Tool: ToggleSlash. A flag decides which users see which version: per environment, by key, by rule on context attributes, by segment, by prerequisite flag or by percentage. SDKs get changes over a stream, with polling as fallback. Every admin write is in the audit trail with before and after.",
  "Today and planned",
  'Solid outline, runs today. Dashed outline and the word "planned", not built yet.',
  "Today",
  "OmniSlash: drilled-ticket gate, worktree per builder, leases, role skills, review and merge skills, role inbox, role runs (`send` starts one when the role has none). Alpha.",
  "TaskSlash: daemon queue, admission by capacity, moon targets. Alpha, build from source with cargo.",
  "UISlash: React components with no styling escape, seven themes, PR review workflow. Version 0.x.",
  "PixelSlash: shot diff, review app, CI wait on review, flaky shot detection, MCP server. Alpha, CLI 0.7.",
  "FlakeSlash: same-commit flake proof, dashboard scan. Alpha, CLI 0.1.0, runs from a checkout.",
  "ToggleSlash: self-hosted flag server, targeting, percentage rollout, live updates. Alpha, npm packages 0.1.0.",
  "Planned",
  "OmniSlash: conflict checks between parallel builders; a team server with per-user access.",
  "TaskSlash: filter plugins on job output; scheduling across a pool of machines; scheduling for CI.",
  "UISlash: a React Native package.",
  "PixelSlash: one review across all of a project's subprojects.",
  "FlakeSlash: a non-blocking check on each PR; a dashboard page per PR; `flakeslash upload`.",
  "ToggleSlash: rollouts that raise the percentage in automatic steps; approvals before a change goes live; scheduled changes.",
  "BundleSlash: measures how much code customers download after a change, comparing two commits' bundles locally before CI.",
  "The tools",
  "OmniSlash: command line tool tracking tickets, projects and the agents that work on them.",
  "TaskSlash: queues builds and tests until the computer has capacity for each.",
  "UISlash: React components and themes a site is built from with props alone, never its own CSS.",
  "PixelSlash: shows what changed on a web page between Main and Branch; a person accepts or rejects each change.",
  "FlakeSlash: finds tests that pass and fail on the same code, grouped into issues.",
  "ToggleSlash: self-hosted feature flags, changed from a command line or dashboard while the app runs.",
  "BundleSlash (planned): bundle size between two commits.",
  "Next: the home page, then each tool's page.",
  "Source: OmniSlash at github.com/slashsuite/omnislash (Elastic License 2.0, source available). UISlash and TaskSlash are MIT. PixelSlash, FlakeSlash and ToggleSlash are Elastic License 2.0. Docs: hack-cove.com/ui (UISlash), slashslash.build/pixelslash/docs (PixelSlash).",
];

/** Where each name in The tools links, and the names that link nowhere. */
const TOOL_LINKS: Record<string, string | undefined> = {
  OmniSlash: "/omnislash",
  TaskSlash: "/taskslash",
  UISlash: undefined,
  PixelSlash: "/pixelslash",
  FlakeSlash: "/flakeslash",
  ToggleSlash: "/toggleslash",
  BundleSlash: undefined,
};

/** The markup of the first `<li>` carrying `attribute`. */
function item(page: string, attribute: string): string {
  const match = page.match(new RegExp(`<li[^>]*${attribute}[\\s\\S]*?</li>`));
  if (!match) throw new Error(`No list item with ${attribute}`);
  return match[0];
}

describe("the approved copy, word for word on /how-it-works", () => {
  const page = html();
  const body = words(page);

  test("the h1 is the headline, once", () => {
    const h1s = [...page.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => unescape((m[1] ?? "").replace(/<[^>]+>/g, "")));
    expect(h1s).toEqual([HEADLINE]);
  });

  test("the title and the meta description are the headline and the share card description", () => {
    expect(unescape(page.match(/<title>([^<]*)<\/title>/)?.[1] ?? "")).toBe(`${HEADLINE} | slashslash.build`);
    expect(unescape(page.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "")).toBe(DESCRIPTION);
  });

  test("every line of the copy is on the page, in order", () => {
    const lines = [
      HEADLINE,
      ...LEAD,
      "The flow diagram",
      ...NODES.flatMap(([id, label, role, tool]) => [`${id} ${label}`, role, tool]),
      ...REST,
    ];
    let from = 0;
    for (const line of lines) {
      const at = body.indexOf(line.replaceAll("`", ""), from);
      expect(at, line).toBeGreaterThan(-1);
      from = at + 1;
    }
  });

  test("each diagram node holds its own row, and only 5a and 6a are planned", () => {
    for (const [id, label, role, tool] of NODES) {
      const markup = item(page, `data-node="${id}"`);
      const text = words(`<body>${markup}`);
      for (const field of [label, role, tool]) expect(text, `${id}: ${field}`).toContain(field.replaceAll("`", ""));
      const planned = PLANNED_NODES.has(id);
      expect(markup, id).toContain(`data-stage="${planned ? "planned" : "today"}"`);
      expect(text.includes("Planned"), id).toBe(planned);
    }
  });

  test("each tool's name links to its page here, and UISlash and BundleSlash link nowhere", () => {
    for (const [name, href] of Object.entries(TOOL_LINKS)) {
      const links = [...item(page, `data-tool="${name}"`).matchAll(/<a[^>]*href="([^"]*)"/g)].map((m) => m[1]);
      expect(links, name).toEqual(href === undefined ? [] : [href]);
    }
  });

  test("has no long dash, and never names the private messenger or the car maker", () => {
    expect(page).not.toMatch(LONG_DASHES);
    expect(page).not.toMatch(/tesla|whatsapp/i);
  });
});
