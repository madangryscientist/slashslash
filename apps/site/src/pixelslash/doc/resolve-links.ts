/*
 * Where a link in a rendered PixelSlash document goes. Cut down from PixelSlash's own resolver to what
 * SECURITY.md and apps/web/SELF-HOST.md need: a document served here goes to its page here, any other
 * repository file to GitHub (the repository is public), and an anchor or an external link stays as it is.
 */

/** A repository file this site renders, and the page it is shown on. */
export const SITE_PATHS: Readonly<Record<string, string>> = {
  "SECURITY.md": "/pixelslash/security",
  "apps/web/SELF-HOST.md": "/pixelslash/self-host",
};

export const REPO_URL = "https://github.com/slashsuite/pixelslash";

/** `a/b/../c` to `a/c`, against the directory of `sourcePath`. */
function joinRepoPath(sourcePath: string, relative: string): string {
  const parts = sourcePath.split("/").slice(0, -1);
  for (const part of relative.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== "." && part !== "") parts.push(part);
  }
  return parts.join("/");
}

/**
 * Where a link in a rendered document goes on the site. `sourcePath` is the document's path in the
 * repository, so a relative link resolves as it does on GitHub.
 */
export function resolveHref(href: string, sourcePath: string): string {
  if (href.startsWith("#") || href.startsWith("mailto:") || /^[a-z]+:\/\//.test(href)) return href;
  const [path = "", anchor] = href.split("#");
  const repoPath = joinRepoPath(sourcePath, path);
  const target = SITE_PATHS[repoPath] ?? `${REPO_URL}/blob/main/${repoPath}`;
  return anchor === undefined ? target : `${target}#${anchor}`;
}
