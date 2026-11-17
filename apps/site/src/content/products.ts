/** The tools, each with the label that is shown next to its name. Plain data, so a test can check it. */

import type { StageId } from "#/content/stages";

export type Product = {
  name: "PixelSlash" | "ToggleSlash" | "BundleSlash" | "FlakeSlash" | "TaskSlash";
  /** The release stage, from the shared `STAGES` table. */
  stage: StageId;
  /** The one question it answers about a CI run. */
  question: string;
  /** What is true today, in plain words. */
  summary: string[];
  /** The tool's own page on this site, linked from its entry on /developers. */
  page?: string;
  /** The licence its source is public under; left out for a tool with no source yet. The footer lists these. */
  licence?: "Elastic License 2.0" | "MIT";
};

export const PRODUCTS: readonly Product[] = [
  {
    name: "PixelSlash",
    stage: "alpha",
    licence: "Elastic License 2.0",
    question: "Does the page look different?",
    summary: [
      "It compares screenshots from before and after a change and points out what really changed.",
      "Small visual changes are easy to miss by eye. This tool spots them and tells real changes apart from tiny differences nobody would notice, so a redesign doesn't ship by accident.",
    ],
  },
  {
    name: "ToggleSlash",
    stage: "alpha",
    licence: "Elastic License 2.0",
    question: "Which features are switched on, and for whom?",
    summary: [
      "It keeps track of feature switches, so you know what turning one on will do.",
      "It is being built now. Its source is public under the Elastic License 2.0, and you host it yourself; nothing is published yet. Today it has a C# server on SQLite with an audit trail of every admin change, a command line, a TypeScript server SDK and a dashboard. The verdict, the pull request check and the migration path are planned but not built.",
    ],
    page: "/toggleslash",
  },
  {
    name: "FlakeSlash",
    stage: "alpha",
    licence: "Elastic License 2.0",
    question: "Can the test results be trusted?",
    summary: [
      "It spots automated checks that pass and fail at random, so a failure means something.",
      "It is being built now. Its source is public under the Elastic License 2.0, and you host it yourself. Today its command line tool scans GitHub Actions history and lists the jobs that failed and passed on the same commit, grouped into issues with their log excerpts. A dashboard and readers for other CI systems are planned.",
    ],
    page: "/flakeslash",
  },
  {
    name: "TaskSlash",
    stage: "alpha",
    licence: "MIT",
    question: "Why did the tests time out?",
    summary: [
      "It queues builds and tests on one machine, so a test fails because of the code, not because everything ran at once.",
      "It is being built now. Its source is public under the MIT license. Today it is a daemon and a command line for Linux that run each job in its own systemd scope, measure what it cost, and start a job only when your computer has capacity for it. A release you can install is planned.",
    ],
    page: "/taskslash",
  },
  {
    name: "BundleSlash",
    stage: "planned",
    question: "Does the app take longer to load?",
    summary: [
      "It measures how much code customers have to download after a change.",
      "It would compare the JavaScript bundles of two commits locally, before CI does, for Bun, Vite and webpack builds.",
    ],
  },
];
