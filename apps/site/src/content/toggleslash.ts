/**
 * The /toggleslash page, as plain data so a test can check it. Written by hand from toggleslash 335fcf3:
 * README.md, docs/quickstart.md, docs/self-hosting.md and the CLI commands in packages/cli/src/commands
 * for what works today. A change in that repo changes this file by hand, except the Planned list, which is
 * read from ToggleSlash's FACTS.md at the commit facts.sha.json pins. Every product claim here cites those facts.
 *
 * Commands stay free of `&` and quotes. The one placeholder, `<your key>`, stands where a reader puts
 * their own key; a test decodes the page's `&lt;` and `&gt;` before it looks for a command. Prose says "admin key": the variable that holds it appears only as code.
 */

import { type Claim, FACTS } from "#/content/facts";
import { TOGGLESLASH_REPO_URL } from "#/content/site";

const DOCS = `${TOGGLESLASH_REPO_URL}/blob/main/docs`;

export const TOGGLESLASH_TITLE: Claim = {
  text: "ToggleSlash: feature flags you can self-host",
  facts: ["toggleslash/what-it-is"],
};

export const TOGGLESLASH_INTRO: { title: string; lead: Claim } = {
  title: "ToggleSlash",
  lead: {
    text: "ToggleSlash is a feature flag service you run yourself. Today it is a server, a command line, server SDKs in TypeScript, Python, Go, Java, C# and Ruby, and a dashboard, and there is no hosted service.",
    facts: [
      "toggleslash/what-it-is",
      "toggleslash/server",
      "toggleslash/cli",
      "toggleslash/typescript-server-sdk",
      "toggleslash/other-server-sdks",
      "toggleslash/dashboard",
      "toggleslash/dashboard-cloudflare-workers",
    ],
  },
};

/** The page's description in search results and link previews. */
export const TOGGLESLASH_DESCRIPTION: Claim = {
  text: "ToggleSlash is a self-hosted feature flag service: a C# server on SQLite, a command line, a TypeScript server SDK and a dashboard, with an audit trail of every change.",
  facts: [
    "toggleslash/what-it-is",
    "toggleslash/server",
    "toggleslash/cli",
    "toggleslash/typescript-server-sdk",
    "toggleslash/dashboard",
    "toggleslash/audit-trail",
  ],
};

export type Feature = {
  title: string;
  /** The command, flag or path that does it, as the repository writes it. Shown on the page and checked by a test. */
  command: string;
  text: Claim;
};

/** What works today. Every toggleslash command here is in packages/cli/src/commands at 335fcf3. */
export const WORKS_TODAY: readonly Feature[] = [
  {
    title: "A server that owns the flags",
    command: "dotnet run --project apps/server/ToggleSlash.Server",
    text: {
      text: "A C# server (ASP.NET Core, .NET 10) keeps projects, environments and flags in one SQLite file, and serves an admin API and the routes the SDK reads. It creates the database at startup and brings it up to the current schema.",
      facts: ["toggleslash/server", "toggleslash/server-from-source"],
    },
  },
  {
    title: "Projects and environments",
    command: "toggleslash projects list|create",
    text: {
      text: "The toggleslash command line manages everything over the admin API. Each project holds its own environments, such as staging and production, which envs list, envs create, envs rename and envs delete look after.",
      facts: ["toggleslash/cli"],
    },
  },
  {
    title: "Flags, targeting and segments",
    command: "toggleslash flags show|create|on|off|archive|delete",
    text: {
      text: "A new flag is a true or false switch, off in every environment. flags on and flags off turn it on or off in one environment and change nothing else. targeting show and targeting set read and replace its rules in one environment, and segments keeps groups that several flags can share.",
      facts: ["toggleslash/cli", "toggleslash/flag-variations", "toggleslash/targeting"],
    },
  },
  {
    title: "SDK keys, shown once",
    command: "toggleslash keys create|list|revoke",
    text: {
      text: "An SDK reads one environment with its own key. The server keeps only a hash of each key, so it is shown once when it is made.",
      facts: ["toggleslash/sdk-keys"],
    },
  },
  {
    title: "Server SDKs in six languages",
    command: "TypeScript on npm, five more from a checkout",
    text: {
      text: "Check a flag inside your own process, with no network call per check. The TypeScript SDK installs from npm, keeps an environment's ruleset current and evaluates flags in your process. The Python, Go, Java, C# and Ruby SDKs also evaluate locally and pass the same conformance tests. None of those five is published: they run from a checkout of the repository.",
      facts: [
        "toggleslash/typescript-server-sdk",
        "toggleslash/live-updates",
        "toggleslash/other-server-sdks",
        "toggleslash/typescript-packages-npm",
      ],
    },
  },
  {
    title: "One evaluation spec",
    command: "docs/evaluation.md",
    text: {
      text: "A flag should give the same answer whichever language asks. Evaluation is written down once, with shared test vectors in `fixtures/evaluation/`. The TypeScript engine and the C# evaluator pass every vector.",
      facts: ["toggleslash/evaluation-spec"],
    },
  },
  {
    title: "An audit trail of every change",
    command: "toggleslash flags history",
    text: {
      text: "Every write to the admin API is recorded. flags history reads one flag's trail, newest first, and the dashboard has the whole audit log.",
      facts: ["toggleslash/audit-trail", "toggleslash/dashboard"],
    },
  },
  {
    title: "Usage counts, and nothing more",
    command: "toggleslash flags list",
    text: {
      text: "The server counts how often each variation of each flag is served per day. It keeps the counts only, never the context of the person the flag was served to. flags list shows when each flag was last evaluated.",
      facts: ["toggleslash/usage-counts"],
    },
  },
  {
    title: "Ask why a flag answered as it did",
    command: "toggleslash diagnose",
    text: {
      text: "diagnose evaluates a flag for a context you give it on the server and says why, without counting it as usage. With --etag it asks as of an earlier ruleset, which rulesets show prints, and runtime says what the server is serving for an environment right now.",
      facts: ["toggleslash/diagnose", "toggleslash/ruleset-lookup", "toggleslash/cli"],
    },
  },
  {
    title: "A dashboard",
    command: "apps/web",
    text: {
      text: "The dashboard works over the same admin API: the flag list, turning a flag on or off, creating and archiving flags, a page per flag with its targeting editor, history and usage, and pages for environments, SDK keys, segments and the audit log. One operator signs in with a password.",
      facts: ["toggleslash/dashboard", "toggleslash/dashboard-sign-in"],
    },
  },
  {
    title: "Self-hosting as a container",
    command: "docker compose up -d --build --wait",
    text: {
      text: "The server runs as one container you build yourself from the repository, with the SQLite file in a Docker volume. It reads the admin key from the environment and never stores it, and it listens on port 8080 on loopback only, so put a TLS proxy in front to expose it. Scoped keys for one project, read or write and expiring, keep the admin key out of CI.",
      facts: ["toggleslash/server-container", "toggleslash/scoped-tokens"],
    },
  },
];

export type TryStep = { lead: string; commands: readonly string[] };

/** How to try it today, from a clone: the quickstart in short. The server is not published. */
export const TRY_IT: { lead: Claim; steps: readonly TryStep[] } = {
  lead: {
    text: "You need Bun and the .NET SDK, or Docker for the server.",
    facts: ["toggleslash/server-from-source", "toggleslash/server-container", "toggleslash/local-stack"],
  },
  steps: [
    {
      lead: "Clone it and install:",
      commands: [`git clone ${TOGGLESLASH_REPO_URL}`, "cd toggleslash", "bun install"],
    },
    {
      lead: "Pick an admin key, note it down, and start the server. Leave it running.",
      commands: [
        "export TOGGLESLASH_ADMIN_TOKEN=$(openssl rand -hex 32)",
        "echo $TOGGLESLASH_ADMIN_TOKEN",
        "export TOGGLESLASH_DB_PATH=$PWD/quickstart.db",
        "ASPNETCORE_URLS=http://127.0.0.1:8080 dotnet run --project apps/server/ToggleSlash.Server",
      ],
    },
    {
      lead: "In a second terminal in the same clone, give the command line the same admin key. Put the key you noted where it says <your key>:",
      commands: ["export TOGGLESLASH_TOKEN=<your key>"],
    },
    {
      lead: "Point it at the server, then make a flag and turn it on:",
      commands: [
        "export TOGGLESLASH_URL=http://127.0.0.1:8080",
        "bun run toggleslash projects create shop --name Shop",
        "bun run toggleslash envs create production --project shop",
        "bun run toggleslash flags create new-checkout --project shop",
        "bun run toggleslash flags on new-checkout --project shop --env production",
      ],
    },
  ],
};

/**
 * Planned: the facts file's own Planned list, read from it. The four items typed here before (a "probably
 * safe to remove" verdict, a pull request check, a read-only way for an AI assistant, a migration path from
 * LaunchDarkly) are not in it.
 */
export const PLANNED: readonly Claim[] = [...FACTS.toggleslash.planned].map(([id, text]) => ({
  text: `${text.charAt(0).toUpperCase()}${text.slice(1)}`,
  facts: [`toggleslash/${id}`],
}));

export const LINKS: readonly { label: string; href: string }[] = [
  { label: "Repository on GitHub", href: TOGGLESLASH_REPO_URL },
  { label: "Quickstart", href: `${DOCS}/quickstart.md` },
  { label: "Self-hosting", href: `${DOCS}/self-hosting.md` },
  { label: "Feature parity", href: `${DOCS}/feature-parity.md` },
];
