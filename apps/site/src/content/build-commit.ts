import { execFileSync } from "node:child_process";

/**
 * The commit a build was made from, for the hidden `<meta name="build-commit">` in every page's head, so
 * anyone can read which commit is live: `curl -s https://slashslash.build/ | grep build-commit`.
 *
 * `BUILD_COMMIT` wins when set: the Deploy workflow passes the commit it deploys, and it is an input of both
 * apps' moon `build` tasks, so CI never reuses a cached dist/ carrying another commit's sha. Otherwise it is
 * `git rev-parse HEAD`, with `-dirty` when `git status --porcelain` lists anything. Locally, with
 * BUILD_COMMIT unset, a moon cache hit can still serve a dist/ built at an older commit; production deploys
 * only from CI, so that does not reach the live site.
 */

/** A full sha, with `-dirty` when the tree had uncommitted changes. */
export const BUILD_COMMIT_PATTERN = /^[0-9a-f]{40}(-dirty)?$/;

interface Sources {
  env?: Record<string, string | undefined>;
  /** Where git runs; the build's working directory by default. */
  cwd?: string;
}

function git(cwd: string, args: string[]): string | undefined {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return undefined;
  }
}

export function buildCommit({ env = process.env, cwd = process.cwd() }: Sources = {}): string {
  const given = env["BUILD_COMMIT"]?.trim();
  if (given) {
    if (!BUILD_COMMIT_PATTERN.test(given))
      throw new Error(`BUILD_COMMIT is "${given}", not a 40-character hex sha (optionally ending -dirty).`);
    return given;
  }
  const head = git(cwd, ["rev-parse", "HEAD"])?.trim();
  const status = git(cwd, ["status", "--porcelain"]);
  if (!head || !/^[0-9a-f]{40}$/.test(head) || status === undefined)
    throw new Error(
      `No build commit: BUILD_COMMIT is unset and \`git rev-parse HEAD\` gave no sha in ${cwd}. Set BUILD_COMMIT or build inside the git checkout.`,
    );
  return status.trim() === "" ? head : `${head}-dirty`;
}

let memo: string | undefined;

/** The build's commit, worked out once per build. */
export const thisBuildCommit = (): string => (memo ??= buildCommit());
