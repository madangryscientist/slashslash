/**
 * The /flakeslash page, as plain data so a test can check it. Written by hand from flakeslash 61f9697:
 * packages/cli/src/cli.ts and packages/cli/src/issue.ts (the CLI help) for what works today, and
 * docs/product.md for what is planned. Nothing is fetched at build time, so a change in that repo
 * changes this file by hand.
 *
 * Commands stay free of `<`, `>`, `&` and quotes, so a test can find each one in the built page's
 * text with no entity decoding.
 */

export const FLAKESLASH_REPO_URL = "https://github.com/madangryscientist/flakeslash";
const DOCS = `${FLAKESLASH_REPO_URL}/blob/main/docs`;

export const FLAKESLASH_TITLE = "FlakeSlash: flaky-test detection you can self-host";

export const FLAKESLASH_INTRO = {
  title: "FlakeSlash",
  lead: "FlakeSlash finds the tests and CI jobs that pass and fail at random, so a failure means something again. It is a command line tool you run yourself, its source is public under the Elastic License 2.0, and it reads GitHub Actions today.",
};

/** The page's description in search results and link previews. */
export const FLAKESLASH_DESCRIPTION =
  "FlakeSlash reads your GitHub Actions history and lists the jobs that failed and passed on the same commit, with the log lines that show why.";

export type Feature = {
  title: string;
  /** The command, flag or file that does it, as the CLI help writes it. Shown on the page and checked by a test. */
  command: string;
  text: string;
};

/** What works today. Every command here appears in `flakeslash --help` at 61f9697. */
export const WORKS_TODAY: readonly Feature[] = [
  {
    title: "Scan GitHub Actions history",
    command: "flakeslash scan owner/repo",
    text: "It reads each repo's GitHub Actions history, with no change to your pipeline, and keeps it in a local SQLite file, so a second scan fetches only what is new. It lists every job that both failed and passed on one commit. Pass several repos to scan them together, and --since to choose how far back to read (90 days by default).",
  },
  {
    title: "A report you open in the browser",
    command: "report.html",
    text: "When the scan is done it writes report.html next to the store: the issues ranked by how many commits they hit in the last 30 days, each with its flake rate, the pull requests it touched and its log excerpt. Add --json to get the same results on standard output.",
  },
  {
    title: "Failures grouped into issues, with no model",
    command: "flakeslash issue list",
    text: "Each failure is grouped into an issue: the same crash with other ports or times is one issue, and known crashes are named by kind. issue list shows them, most failures first.",
  },
  {
    title: "Correct the catalogue by hand",
    command: "flakeslash issue confirm",
    text: "When the grouping is wrong you fix that one entry, and the fix survives every later scan: issue confirm marks a real flake, issue dismiss hides one, issue rename names it, issue merge folds two into one and issue split moves the matching failures into a new issue.",
  },
  {
    title: "Explanations from your own model, if you want them",
    command: "--model-url",
    text: "Failures no known pattern recognises can be explained by your own OpenAI-compatible endpoint. You set a hard spending cap with --cap-usd and both prices; it never spends past the cap. One redacted excerpt is sent per unexplained issue, so a failure repeated 50 times costs one call. The flake list never depends on the answer.",
  },
  {
    title: "Only excerpts are kept",
    command: "--store",
    text: "For each failed job it reads the log once, keeps the lines around the failure with secrets removed, and links to the full log. The whole log is never stored. The store is one SQLite file on your machine (.flakeslash/flakeslash.db unless --store names another), and with no endpoint named, nothing is sent anywhere.",
  },
];

/** How to try it today, from a clone. It is not published on npm. */
export const TRY_IT = {
  lead: "FlakeSlash is not published on npm yet. Run it from a clone, with Bun. It reads a GitHub access key from the GITHUB_TOKEN variable.",
  commands: [
    "git clone https://github.com/madangryscientist/flakeslash",
    "cd flakeslash",
    "bun install",
    "GITHUB_TOKEN=... bun run flakeslash scan owner/repo",
  ],
};

/** Planned in docs/product.md and not built at 61f9697. */
export const PLANNED: readonly string[] = [
  "Upload: send any log or JUnit file, so a CI system without a reader can join in.",
  "Readers for other CI systems, such as CircleCI and Jenkins.",
  "A dashboard, hosted or self-hosted, with GitHub sign-in: the catalogue, a page per issue, a reliability overview and a page per pull request.",
  "One pull request check that never blocks and says whether a failure is new in the pull request or already flaking on main.",
  "Teams from the CODEOWNERS file on each test.",
  "Later, once detection has earned trust: test quarantine, automatic retries, chat alerts, timing screens and a blocking check.",
];

export const LINKS: readonly { label: string; href: string }[] = [
  { label: "Repository on GitHub", href: FLAKESLASH_REPO_URL },
  { label: "Getting started", href: `${DOCS}/getting-started.md` },
  { label: "The design", href: `${DOCS}/product.md` },
];
