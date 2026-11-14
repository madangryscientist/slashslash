/**
 * The /toggleslash page, as plain data so a test can check it. Written by hand from toggleslash 335fcf3:
 * README.md, docs/quickstart.md, docs/self-hosting.md and the CLI commands in packages/cli/src/commands
 * for what works today. Nothing is fetched at build time, so a change in that repo changes this file by hand.
 *
 * Commands stay free of `<`, `>`, `&` and quotes, so a test can find each one in the built page's
 * text with no entity decoding. Prose says "admin key": the variable that holds it appears only as code.
 */

import { TOGGLESLASH_REPO_URL } from "#/content/site";

const DOCS = `${TOGGLESLASH_REPO_URL}/blob/main/docs`;

export const TOGGLESLASH_TITLE = "ToggleSlash: feature flags you can self-host";

export const TOGGLESLASH_INTRO = {
  title: "ToggleSlash",
  lead: "ToggleSlash is a feature flag service you run yourself. Its source is public under the Elastic License 2.0. Today it is a server, a command line, a TypeScript server SDK and a dashboard, all run from a clone: nothing is published yet, and there is no hosted service.",
};

/** The page's description in search results and link previews. */
export const TOGGLESLASH_DESCRIPTION =
  "ToggleSlash is a self-hosted feature flag service: a C# server on SQLite, a command line, a TypeScript server SDK and a dashboard, with an audit trail of every change.";

export type Feature = {
  title: string;
  /** The command, flag or path that does it, as the repository writes it. Shown on the page and checked by a test. */
  command: string;
  text: string;
};

/** What works today. Every toggleslash command here is in packages/cli/src/commands at 335fcf3. */
export const WORKS_TODAY: readonly Feature[] = [
  {
    title: "A server that owns the flags",
    command: "dotnet run --project apps/server/ToggleSlash.Server",
    text: "A C# server (ASP.NET Core, .NET 10) keeps projects, environments and flags in one SQLite file, and serves an admin API and the routes the SDK reads. It creates the database at startup and brings it up to the current schema.",
  },
  {
    title: "Projects and environments",
    command: "toggleslash projects list|create",
    text: "The toggleslash command line manages everything over the admin API. Each project holds its own environments, such as staging and production, which envs list, envs create, envs rename and envs delete look after.",
  },
  {
    title: "Flags, targeting and segments",
    command: "toggleslash flags show|create|on|off|archive|delete",
    text: "A new flag is a true or false switch, off in every environment. flags on and flags off turn it on or off in one environment and change nothing else. targeting show and targeting set read and replace its rules in one environment, and segments keeps groups that several flags can share.",
  },
  {
    title: "SDK keys, shown once",
    command: "toggleslash keys create|list|revoke",
    text: "An SDK reads one environment with its own key. The server keeps only a hash of each key, so it is shown once when it is made.",
  },
  {
    title: "A TypeScript server SDK",
    command: "packages/sdk",
    text: "The server SDK fetches an environment's rules and evaluates flags inside your process, with the reason for each answer. It keeps a stream open to the server, so turning a flag on reaches a running app without a restart. It is not published as a package, so for now you import it from the clone.",
  },
  {
    title: "An audit trail of every change",
    command: "toggleslash flags history",
    text: "Every write to the admin API is recorded. flags history reads one flag's trail, newest first, and the dashboard has the whole audit log.",
  },
  {
    title: "Usage counts, and nothing more",
    command: "toggleslash flags list",
    text: "The server counts how often each variation of each flag is served per day. It keeps the counts only, never the context of the person the flag was served to. flags list shows when each flag was last evaluated.",
  },
  {
    title: "Ask why a flag answered as it did",
    command: "toggleslash diagnose",
    text: "diagnose evaluates a flag for a context you give it on the server and says why, without counting it as usage. With --etag it asks as of an earlier ruleset, which rulesets show prints, and runtime says what the server is serving for an environment right now.",
  },
  {
    title: "A dashboard",
    command: "apps/web",
    text: "The dashboard works over the same admin API: the flag list, turning a flag on or off, creating and archiving flags, a page per flag with its targeting editor, history and usage, and pages for environments, SDK keys, segments and the audit log. One operator signs in with a password. Where it is hosted is not decided yet.",
  },
  {
    title: "Self-hosting as a container",
    command: "docker compose up -d --build --wait",
    text: "The server runs as one container you build yourself from the repository, with the SQLite file in a Docker volume. It reads the admin key from the environment and never stores it, and it listens on port 8080 on loopback only, so put a TLS proxy in front to expose it. Scoped keys for one project, read or write and expiring, keep the admin key out of CI.",
  },
];

export type TryStep = { lead: string; commands: readonly string[] };

/** How to try it today, from a clone: the quickstart in short. Nothing is published. */
export const TRY_IT: { lead: string; steps: readonly TryStep[] } = {
  lead: "Nothing is published yet, so run it from a clone. You need Bun and the .NET SDK, or Docker for the server.",
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
      lead: "In a second terminal in the same clone, give the command line the server and the same admin key, then make a flag and turn it on:",
      commands: [
        "export TOGGLESLASH_URL=http://127.0.0.1:8080",
        "export TOGGLESLASH_TOKEN=...",
        "bun run toggleslash projects create shop --name Shop",
        "bun run toggleslash envs create production --project shop",
        "bun run toggleslash flags create new-checkout --project shop",
        "bun run toggleslash flags on new-checkout --project shop --env production",
      ],
    },
  ],
};

/** Planned, and not built at 335fcf3. */
export const PLANNED: readonly string[] = [
  "A \"probably safe to remove\" verdict for each flag, with the evidence behind it.",
  "A pull request check.",
  "A read-only way for an AI assistant to ask what a flag does.",
  "A migration path from LaunchDarkly.",
];

export const LINKS: readonly { label: string; href: string }[] = [
  { label: "Repository on GitHub", href: TOGGLESLASH_REPO_URL },
  { label: "Quickstart", href: `${DOCS}/quickstart.md` },
  { label: "Self-hosting", href: `${DOCS}/self-hosting.md` },
  { label: "Feature parity", href: `${DOCS}/feature-parity.md` },
];
