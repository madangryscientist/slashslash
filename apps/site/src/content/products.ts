/** The four tools, each with the label that is shown next to its name. Plain data, so a test can check it. */

export type ProductStatus = "Available now" | "In early development" | "Planned";

export type Product = {
  name: "PixelSlash" | "ToggleSlash" | "BundleSlash" | "FlakeSlash";
  status: ProductStatus;
  /** The one question it answers about a CI run. */
  question: string;
  /** What is true today, in plain words. */
  summary: string[];
  /** The tool's own page on this site, linked from its entry on /developers. */
  page?: string;
};

export const PRODUCTS: readonly Product[] = [
  {
    name: "PixelSlash",
    status: "Available now",
    question: "Does the page look different?",
    summary: [
      "It compares screenshots from before and after a change and points out what really changed.",
      "Small visual changes are easy to miss by eye. This tool spots them and tells real changes apart from harmless noise, so a redesign doesn't ship by accident.",
    ],
  },
  {
    name: "ToggleSlash",
    status: "In early development",
    question: "Which features are switched on, and for whom?",
    summary: [
      "It keeps track of feature switches, so you know what turning one on will do.",
      "It is being built now: a feature flag service you host yourself, with FSL as the intended licence. Today it has a C# server on SQLite with an audit trail of every admin change, a small command line, a TypeScript server SDK and a dashboard. The verdict, the pull request check and the migration path are planned but not built.",
    ],
  },
  {
    name: "FlakeSlash",
    status: "In early development",
    question: "Can the test results be trusted?",
    summary: [
      "It spots automated checks that pass and fail at random, so a failure means something.",
      "It is being built now. Its source is public under the Elastic License 2.0, and you host it yourself. Today its command line tool scans GitHub Actions history and lists the jobs that failed and passed on the same commit, grouped into issues with their log excerpts. A dashboard and readers for other CI systems are planned.",
    ],
    page: "/flakeslash",
  },
  {
    name: "BundleSlash",
    status: "Planned",
    question: "Did the app get heavier to load?",
    summary: [
      "It measures how much code customers have to download after a change.",
      "It would compare the JavaScript bundles of two commits locally, before CI does, for Bun, Vite and webpack builds.",
    ],
  },
];

type StatusTone = "emerald" | "amber" | "slate";

export const STATUS_TONE: Record<ProductStatus, StatusTone> = {
  "Available now": "emerald",
  "In early development": "amber",
  "Planned": "slate",
};
