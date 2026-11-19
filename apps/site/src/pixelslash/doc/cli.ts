import cliMarkdown from "@pixelslash-src/docs/cli.md?raw";
import { buildCommandIndex, commandIndexMarkdown } from "#/pixelslash/doc/cli-index";
import { splitCli } from "#/pixelslash/doc/cli-pages";
import { stripTicketIds } from "#/pixelslash/doc/doc-text";
import { DOC_PAGES } from "#/pixelslash/doc/docs-map";

/*
 * docs/cli.md, fetched at the pinned commit, cut once at build time into the pages of the docs map.
 * PixelSlash's site cut it in a Vite plugin so the browser loaded one page's slice; these pages are
 * static HTML with no script, so one module does it.
 */

export const CLI_SPLIT = splitCli(stripTicketIds(cliMarkdown));

/** GitHub anchor of a cli.md heading → the slug of the docs page that shows it. */
export const ANCHOR_PAGE: Readonly<Record<string, string>> = Object.fromEntries(CLI_SPLIT.anchorPage);

/** What docs/cli.md says before its first section, with its own title: the docs index leads with it. */
export const CLI_INTRO = `# ${CLI_SPLIT.title}\n\n${CLI_SPLIT.preamble.map((token) => token.raw).join("")}`;

/** A page cut from cli.md: its markdown, and the anchor each of its headings has in the whole file. */
export type CliPage = { markdown: string; ids: string[] };

/** Every docs page cut from cli.md, the generated command index among them, by slug. */
export const CLI_PAGES: ReadonlyMap<string, CliPage> = new Map(
  DOC_PAGES.filter((page) => page.file === undefined).map((page): [string, CliPage] => {
    if (page.kind === "cli-index") {
      return [page.slug, { markdown: commandIndexMarkdown(buildCommandIndex(CLI_SPLIT.pages)), ids: [] }];
    }
    const tokens = CLI_SPLIT.pages.get(page.slug);
    if (tokens === undefined) throw new Error(`docs: no cli page ${page.slug}`);
    return [
      page.slug,
      {
        markdown: tokens.map((token) => token.raw).join(""),
        ids: tokens.flatMap((token) => (token.type === "heading" ? [CLI_SPLIT.ids.get(token) ?? ""] : [])),
      },
    ];
  }),
);
