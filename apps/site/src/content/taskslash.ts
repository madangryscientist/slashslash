/**
 * The /taskslash page, as plain data so a test can check it. Written by hand from taskslash a59d7fa:
 * README.md, kept beside this file as taskslash-readme.md so a test can check every command against it, and
 * scripts/install-service.ts for what the install step does (it cargo installs the binary into ~/.cargo/bin).
 * Nothing is fetched at build time, so a change in that repo changes this file, and that copy, by hand.
 *
 * Commands stay free of `&` and quotes, and each is written exactly as the README writes it.
 */

import { TASKSLASH_REPO_URL } from "#/content/site";

export const TASKSLASH_TITLE = "TaskSlash: admission control for builds and tests on one machine";

export const TASKSLASH_INTRO = {
  title: "TaskSlash",
  lead: "Several builds, tests and browser runs started at once, by you or by coding agents in several worktrees, overload a machine until tests time out for reasons that have nothing to do with the code. TaskSlash puts a small daemon in front of them: each command asks it for a slot, and it keeps the queue and the record of what ran. Its source is public under the MIT license. It is built for Linux, from a clone: there is no release to install yet.",
};

/** The page's description in search results and link previews. */
export const TASKSLASH_DESCRIPTION =
  "TaskSlash queues builds and tests on one Linux machine: each job runs in its own systemd scope, is measured, and starts only when your computer has capacity for it.";

export type Feature = {
  title: string;
  /** The command, exactly as the README writes it. Shown on the page and checked by a test. */
  command: string;
  text: string;
};

/** What works today. Every command here is in README.md at a59d7fa. */
export const WORKS_TODAY: readonly Feature[] = [
  {
    title: "A daemon that keeps the queue",
    command: "taskslash daemon",
    text: "The daemon samples the whole machine once a second, keeps the queue of waiting jobs and records what each one cost. It normally runs as a systemd user unit, and the record is one SQLite file that only the daemon writes.",
  },
  {
    title: "Any command, run as a job",
    command: "taskslash run -- bun run test",
    text: "run runs the command itself, in your directory, with your environment and terminal, and exits with its exit code. With no daemon running it does not run the command.",
  },
  {
    title: "Measured in its own scope",
    command: "taskslash history gate",
    text: "With a systemd user session, every job runs in a scope of its own, and the daemon reads its CPU, memory and disk writes while it runs. Jobs are measured, never capped. history prints a key's estimate, then what its last 20 runs cost. Without a user session, as in CI, a container or macOS, jobs run unmeasured: wall time and exit code only.",
  },
  {
    title: "A job starts only when it fits",
    command: "taskslash why 7",
    text: "CPU, memory and disk writes each have a budget. A job starts when its estimate fits in what the running jobs and everything else on the machine leave, and nothing starts while the machine is under pressure. A job that waits says why, and why prints the same sentence.",
  },
  {
    title: "A cost class for a job never seen",
    command: "taskslash run --kind browser --name visual -- bun run visual",
    text: "--kind is a job's cost class: test, typecheck, build, browser or command. It gives the defaults until the job's name has history; after that the estimate comes from its own measured runs.",
  },
  {
    title: "First in line, never first to run over others",
    command: "taskslash run --class urgent -- bun run test",
    text: "A class puts a job higher in the queue: urgent, flake, interactive, normal or background. A job that has waited more than 15 minutes moves up one class. A higher class never stops, kills or freezes a running job.",
  },
  {
    title: "moon targets, one job each",
    command: "taskslash moon :typecheck :test",
    text: "It replaces a moon run with a fixed concurrency, which is blind to the other gates on the machine. Each target is its own job, so the daemon decides how many run at once, across every worktree, and each target and what it depends on runs exactly once.",
  },
  {
    title: "What the machine is doing now",
    command: "taskslash status --json",
    text: "status shows CPU, pressure, memory, each disk and each mount from the daemon's latest reading, then every running and waiting job. With --json it is one line of JSON.",
  },
  {
    title: "Every job's output is kept",
    command: "taskslash logs --failed",
    text: "run writes the command's output to you exactly as before, and also into a log of the job's own. logs prints one log unchanged: a running job's, a recorded run's, the newest run of a name, or the newest run that failed. Logs are kept for 7 days, in under 1 GiB.",
  },
  {
    title: "Plugins, in any language",
    command: "taskslash plugins",
    text: "An executable named taskslash-<name> on PATH runs as taskslash <name>, the way git and cargo find theirs. plugins lists the ones it finds.",
  },
];

export type TryStep = { lead: string; commands: readonly string[] };

/** How to try it today, from a clone: the README's Develop and install sections in short. */
export const TRY_IT: { lead: string; steps: readonly TryStep[] } = {
  lead: "There is no release to install yet, so build it from a clone, on Linux, with Bun and rustup. Jobs are measured only under a systemd user session; without one they still run, unmeasured.",
  steps: [
    {
      lead: "Clone it, install the Rust toolchain it pins, and install:",
      commands: [`git clone ${TASKSLASH_REPO_URL}`, "cd taskslash", "rustup toolchain install", "bun install"],
    },
    {
      lead: "Install the daemon as a systemd user unit. The script builds the taskslash command into ~/.cargo/bin first, and the same command upgrades it after you pull a new main.",
      commands: ["bun scripts/install-service.ts"],
    },
    {
      lead: "See what the machine is doing, then run a command as a job:",
      commands: ["taskslash status", "taskslash run -- bun run test"],
    },
  ],
};

/** Planned, and not built at a59d7fa: the README marks these as coming, or says they do not exist yet. */
export const PLANNED: readonly string[] = [
  "A release you can install. There is no release workflow for the binary yet.",
  "Listener plugins, which follow the daemon's events as jobs are queued, start and end.",
  "Filter plugins, which rewrite a job's output on its way to the log and the terminal, such as removing secrets.",
];

export const LINKS: readonly { label: string; href: string }[] = [
  { label: "Repository on GitHub", href: TASKSLASH_REPO_URL },
  { label: "Every command", href: `${TASKSLASH_REPO_URL}#use` },
  { label: "When a job starts", href: `${TASKSLASH_REPO_URL}#admission` },
  { label: "Install as a systemd user unit", href: `${TASKSLASH_REPO_URL}#install-the-daemon-as-a-systemd-user-unit` },
];
