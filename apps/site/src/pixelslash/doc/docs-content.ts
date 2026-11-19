import { type Token, lexer } from "marked";
import { CLI_INTRO, CLI_PAGES } from "#/pixelslash/doc/cli";
import { marked, plainText } from "#/pixelslash/doc/doc-text";
import { DOC_PAGES, type DocPageDef } from "#/pixelslash/doc/docs-map";
import { type Doc, type Heading, parseDoc } from "#/pixelslash/doc/markdown";

/*
 * The docs pages' documents, read at build time from the PixelSlash files fetched at the pinned
 * commit (scripts/fetch-sources.ts): a page cut from docs/cli.md, or a repository file of its own.
 * A page renders what the file says at the pin; the site keeps no copy of its own.
 */

/** Every fetched markdown file under docs/, by its repository path. */
const FILES: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>("../../../.sources/pixelslash/docs/**/*.md", {
      query: "?raw",
      import: "default",
      eager: true,
    }),
  ).map(([path, text]) => [path.slice(path.indexOf("docs/")), text]),
);

/** A page cut from cli.md: its headings keep the anchors GitHub gives them in the whole file. */
function parseCliPage(page: DocPageDef): Doc {
  const cut = CLI_PAGES.get(page.slug);
  if (cut === undefined) throw new Error(`docs: page ${page.slug} has no sections`);
  if (page.kind === "cli-index") return parseDoc(cut.markdown, "docs/cli.md", page.slug);
  const tokens = marked(lexer(cut.markdown));
  const ids = new WeakMap<Token, string>();
  const headings: Heading[] = [];
  for (const token of tokens) {
    if (token.type !== "heading") continue;
    const id = cut.ids[headings.length] ?? "";
    ids.set(token, id);
    headings.push({ depth: token.depth, text: plainText(token.tokens), id });
  }
  return { source: "docs/cli.md", title: page.title, tokens, headings, ids, page: page.slug };
}

function parsePage(page: DocPageDef): Doc {
  if (page.file === undefined) return parseCliPage(page);
  const markdown = FILES[page.file];
  if (markdown === undefined) throw new Error(`docs: ${page.file} was not fetched; run scripts/fetch-sources.ts`);
  return parseDoc(markdown, page.file, page.slug);
}

/** Every docs page's document, by slug, in nav order. */
export const DOCS_BY_SLUG: ReadonlyMap<string, Doc> = new Map(DOC_PAGES.map((page) => [page.slug, parsePage(page)]));

/** The document a docs page shows. */
export function docFor(slug: string): Doc {
  const doc = DOCS_BY_SLUG.get(slug);
  if (doc === undefined) throw new Error(`docs: no page ${slug}`);
  return doc;
}

/** What docs/cli.md says before its first section: the docs index leads with it. */
export const CLI_INTRO_DOC = parseDoc(CLI_INTRO, "docs/cli.md");
