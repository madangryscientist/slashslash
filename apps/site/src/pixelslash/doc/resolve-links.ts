import { ANCHOR_PAGE } from "#/pixelslash/doc/cli";
import { DOC_PAGES } from "#/pixelslash/doc/docs-map";

/*
 * Where a link in a rendered PixelSlash document goes, ported from PixelSlash's own resolver. A
 * document served here goes to its page here, a heading of docs/cli.md to the docs page that shows
 * it, a file of PixelSlash's site to the copy served under /pixelslash, any other repository file
 * to GitHub (the repository is public), and an anchor or an external link stays as it is.
 */

export const DOCS = "/pixelslash/docs";

/** A repository file this site renders, and the page it is shown on. */
export const SITE_PATHS: Readonly<Record<string, string>> = {
  "docs/cli.md": DOCS,
  ...Object.fromEntries(DOC_PAGES.flatMap((page) => (page.file ? [[page.file, `${DOCS}/${page.slug}`]] : []))),
  "SECURITY.md": "/pixelslash/security",
  "apps/web/SELF-HOST.md": "/pixelslash/self-host",
  "docs/capabilities/matrix.html": "/pixelslash/compare",
};

export const REPO_URL = "https://github.com/slashsuite/pixelslash";

const CLI_DOC_PATH = "docs/cli.md";
const PUBLIC_DIR = "apps/site/public/";

/** `a/b/../c` to `a/c`, against the directory of `sourcePath`. */
function joinRepoPath(sourcePath: string, relative: string): string {
  const parts = sourcePath.split("/").slice(0, -1);
  for (const part of relative.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== "." && part !== "") parts.push(part);
  }
  return parts.join("/");
}

/** Where a heading of docs/cli.md is shown: the site cuts the file into pages, so an anchor names one. */
function cliAnchorHref(anchor: string, currentPage?: string): string {
  const slug = Object.hasOwn(ANCHOR_PAGE, anchor) ? ANCHOR_PAGE[anchor] : undefined;
  if (slug === undefined) throw new Error(`${CLI_DOC_PATH} has no heading #${anchor} to link to`);
  return slug === currentPage ? `#${anchor}` : `${DOCS}/${slug}#${anchor}`;
}

function resolveRepoFile(href: string, sourcePath: string): string {
  const [path = "", anchor] = href.split("#");
  // A root-relative link is from the repository's root, as on GitHub.
  const repoPath = path.startsWith("/") ? joinRepoPath("", path) : joinRepoPath(sourcePath, path);
  if (repoPath === CLI_DOC_PATH && anchor !== undefined) return cliAnchorHref(anchor);
  if (repoPath.startsWith(PUBLIC_DIR)) return `/pixelslash/${repoPath.slice(PUBLIC_DIR.length)}`;
  const target = SITE_PATHS[repoPath] ?? `${REPO_URL}/blob/main/${repoPath}`;
  return anchor === undefined ? target : `${target}#${anchor}`;
}

/**
 * Where an image in a rendered document is served from, or `null` when it is not in PixelSlash's
 * site `public` folder (fetched to public/pixelslash). The path stays relative in the file, so
 * GitHub draws it as well.
 */
export function resolveImageSrc(href: string, sourcePath: string): string | null {
  const repoPath = joinRepoPath(sourcePath, href);
  return repoPath.startsWith(PUBLIC_DIR) ? `/pixelslash/${repoPath.slice(PUBLIC_DIR.length)}` : null;
}

/**
 * Where a link in a rendered document goes on the site. `sourcePath` is the document's path in the
 * repository, so a relative link resolves as it does on GitHub. `currentPage` is the docs page a
 * `#anchor` link sits on, so a link to a heading elsewhere in docs/cli.md can leave it.
 */
export function resolveHref(href: string, sourcePath: string, currentPage?: string): string {
  if (href.startsWith("#") && sourcePath === CLI_DOC_PATH) return cliAnchorHref(href.slice(1), currentPage);
  if (href.startsWith("#") || href.startsWith("mailto:") || /^[a-z]+:\/\//.test(href)) return href;
  // A docs page, as the generated command index writes its links.
  if (/^\/docs\/[a-z0-9-]+$/.test(href)) return `/pixelslash${href}`;
  return resolveRepoFile(href, sourcePath);
}
