/**
 * The /flakeslash page, as plain data so a test can check it. Written by hand from flakeslash 61f9697:
 * packages/cli/src/cli.ts and packages/cli/src/issue.ts (the CLI help) for what works today, and
 * docs/product.md for what is planned. Nothing is fetched at build time, so a change in that repo
 * changes this file by hand. Every product claim here cites the product's FACTS.md (facts.test.ts).
 *
 * Commands stay free of `&` and quotes. The one placeholder, `<your key>`, stands where a reader puts
 * their own key; a test decodes the page's `&lt;` and `&gt;` before it looks for a command.
 */

import type { Claim } from "#/content/facts";

export const FLAKESLASH_REPO_URL = "https://github.com/madangryscientist/flakeslash";
const DOCS = `${FLAKESLASH_REPO_URL}/blob/main/docs`;

export const FLAKESLASH_TITLE: Claim = {
  text: "FlakeSlash: flaky-test detection you can self-host",
  facts: ["flakeslash/what-it-is", "flakeslash/cli-from-checkout", "flakeslash/self-hosted-dashboard"],
};

export const FLAKESLASH_INTRO: { title: string; lead: Claim } = {
  title: "FlakeSlash",
  lead: {
    text: "FlakeSlash finds the CI jobs that both fail and pass on the same commit, so a failure means something again. It reads GitHub Actions today.",
    facts: ["flakeslash/flake-same-commit", "flakeslash/scan-github-actions"],
  },
};

/** The page's description in search results and link previews. */
export const FLAKESLASH_DESCRIPTION: Claim = {
  text: "FlakeSlash reads your GitHub Actions history and lists the jobs that failed and passed on the same commit, with the log lines that show why.",
  facts: ["flakeslash/scan-github-actions", "flakeslash/flake-same-commit", "flakeslash/redacted-excerpts"],
};

export type Feature = {
  title: string;
  /** The command, flag or file that does it, as the CLI help writes it. Shown on the page and checked by a test. */
  command: string;
  text: Claim;
};

/** What works today. Every command here appears in `flakeslash --help` at 61f9697. */
export const WORKS_TODAY: readonly Feature[] = [
  {
    title: "Scan GitHub Actions history",
    command: "flakeslash scan owner/repo",
    text: {
      text: "It reads each repo's GitHub Actions history, with no change to your pipeline, and keeps it in a local SQLite file, so a second scan fetches only what is new. It lists every job that both failed and passed on one commit. Pass several repos to scan them together, and --since to choose how far back to read (90 days by default).",
      facts: ["flakeslash/scan-github-actions", "flakeslash/local-store", "flakeslash/flake-same-commit"],
    },
  },
  {
    title: "A report you open in the browser",
    command: "report.html",
    text: {
      text: "When the scan is done it writes report.html next to the store: the issues ranked by how many commits they hit in the last 30 days, each with its flake rate, the pull requests it touched and its log excerpt. Add --json to get the repos, the explanations and the catalogue as JSON on standard output instead of the summary.",
      facts: ["flakeslash/report-html", "flakeslash/json-output"],
    },
  },
  {
    title: "Failures grouped into issues, with no model",
    command: "flakeslash issue list",
    text: {
      text: "Each failure is grouped into an issue: the same crash with other ports or times is one issue, and known crashes are named by kind. issue list shows them, most failures first.",
      facts: ["flakeslash/issue-grouping", "flakeslash/issue-corrections"],
    },
  },
  {
    title: "Correct the catalogue by hand",
    command: "flakeslash issue confirm|dismiss|rename|merge|split",
    text: {
      text: "When the grouping is wrong you fix that one entry, and the fix survives every later scan: issue confirm marks a real flake, issue dismiss hides one, issue rename names it, issue merge folds two into one and issue split moves the matching failures into a new issue.",
      facts: ["flakeslash/issue-corrections"],
    },
  },
  {
    title: "Explanations from your own model, if you want them",
    command: "--model-url",
    text: {
      text: "Failures no known pattern recognises can be explained by your own OpenAI-compatible endpoint. You set a hard spending cap with --cap-usd and both prices; it never spends past the cap. One redacted excerpt is sent per unexplained issue, so a failure repeated 50 times costs one call. The flake list never depends on the answer.",
      facts: ["flakeslash/model-explanations"],
    },
  },
  {
    title: "What is kept, and where",
    command: "--store",
    text: {
      text: "For each failed job it reads the log once, keeps the lines around the failure with secrets removed, and links to the full log. The whole log is never stored. The store is one SQLite file on your machine (.flakeslash/flakeslash.db unless --store names another), and with no endpoint named, nothing is sent anywhere.",
      facts: ["flakeslash/redacted-excerpts", "flakeslash/local-store", "flakeslash/model-explanations"],
    },
  },
];

export type TryStep = { lead: string; commands: readonly string[] };

/** How to try it today, from a clone. It is not published on npm. */
export const TRY_IT: { lead: Claim; steps: readonly TryStep[] } = {
  lead: {
    text: "FlakeSlash is not published on npm yet. Run it from a clone, with Bun.",
    facts: ["flakeslash/cli-not-on-npm", "flakeslash/cli-from-checkout"],
  },
  steps: [
    {
      lead: "Clone it and install:",
      commands: ["git clone https://github.com/madangryscientist/flakeslash", "cd flakeslash", "bun install"],
    },
    {
      lead: "Give it a GitHub access key that can read your repo. Put your own key where it says <your key>:",
      commands: ["export GITHUB_TOKEN=<your key>"],
    },
    {
      lead: "Then scan the repo:",
      commands: ["bun run flakeslash scan owner/repo"],
    },
  ],
};

/** Planned in docs/product.md and not built at 61f9697. */
export const PLANNED: readonly Claim[] = [
  { text: "Upload: send any log or JUnit file, so a CI system without a reader can join in.", facts: ["flakeslash/upload", "flakeslash/junit-reader"] },
  { text: "Readers for other CI systems, such as CircleCI and Jenkins.", facts: ["flakeslash/later-features"] },
  { text: "A page per issue, a reliability overview and a page per pull request.", facts: ["flakeslash/issue-page", "flakeslash/reliability-overview", "flakeslash/pr-page"] },
  { text: "One pull request check that never blocks and says whether a failure is new in the pull request or already flaking on main.", facts: ["flakeslash/pr-check", "flakeslash/pr-page"] },
  { text: "Teams from the CODEOWNERS file on each test.", facts: ["flakeslash/teams-from-codeowners"] },
  { text: "Later, once detection has earned trust: test quarantine, automatic retries, chat alerts, timing screens and a blocking check.", facts: ["flakeslash/later-features"] },
];

export const LINKS: readonly { label: string; href: string }[] = [
  { label: "Repository on GitHub", href: FLAKESLASH_REPO_URL },
  { label: "Getting started", href: `${DOCS}/getting-started.md` },
  { label: "The design", href: `${DOCS}/product.md` },
];
