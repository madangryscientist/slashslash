import { execFileSync } from "node:child_process";
import { existsSync, globSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { BUILD_COMMIT_PATTERN, buildCommit } from "./build-commit";

/** The built site to check: this app's dist/, or the one SITE_DIST names (the next app's vitest config sets it). */
const DIST = process.env["SITE_DIST"] ?? resolve(import.meta.dirname, "../../dist");
const SHA = "0123456789abcdef0123456789abcdef01234567";

const temps: string[] = [];
const tempDir = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "build-commit-"));
  temps.push(dir);
  return dir;
};
afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A one-commit repo in a temp dir, with git's identity given on the command line. */
function repo(): { dir: string; head: string } {
  const dir = tempDir();
  const run = (...args: string[]): string =>
    execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args], {
      cwd: dir,
      encoding: "utf8",
    }).trim();
  run("init", "-q");
  writeFileSync(join(dir, "a.txt"), "a\n");
  run("add", "a.txt");
  run("commit", "-q", "-m", "a");
  return { dir, head: run("rev-parse", "HEAD") };
}

describe("buildCommit", () => {
  test("BUILD_COMMIT wins over git", () => {
    const { dir } = repo();
    expect(buildCommit({ env: { BUILD_COMMIT: SHA }, cwd: dir })).toBe(SHA);
  });

  test("BUILD_COMMIT that is not a sha fails", () => {
    expect(() => buildCommit({ env: { BUILD_COMMIT: "main" }, cwd: tempDir() })).toThrow(/BUILD_COMMIT/);
  });

  test("a clean tree gives HEAD", () => {
    const { dir, head } = repo();
    expect(buildCommit({ env: {}, cwd: dir })).toBe(head);
  });

  test("a dirty tree gives HEAD with -dirty", () => {
    const { dir, head } = repo();
    writeFileSync(join(dir, "b.txt"), "b\n");
    expect(buildCommit({ env: {}, cwd: dir })).toBe(`${head}-dirty`);
  });

  test("neither source fails, naming both", () => {
    // GIT_CEILING_DIRECTORIES keeps git from finding a repo above the temp dir.
    const dir = tempDir();
    const saved = process.env["GIT_CEILING_DIRECTORIES"];
    process.env["GIT_CEILING_DIRECTORIES"] = tmpdir();
    try {
      expect(() => buildCommit({ env: {}, cwd: dir })).toThrow(/BUILD_COMMIT is unset and `git rev-parse HEAD`/);
    } finally {
      if (saved === undefined) delete process.env["GIT_CEILING_DIRECTORIES"];
      else process.env["GIT_CEILING_DIRECTORIES"] = saved;
    }
  });
});

describe("built pages", () => {
  const pages = (): string[] => {
    if (!existsSync(resolve(DIST, "404.html")))
      throw new Error(`No built page in ${DIST}. Run the build first: bun run build.`);
    return globSync("**/*.html", { cwd: DIST }).toSorted();
  };

  test("every page carries one well-formed build-commit meta in its head, and nowhere else", () => {
    const wrong = pages().flatMap((page) => {
      const html = readFileSync(resolve(DIST, page), "utf8");
      const metas = [...html.matchAll(/<meta name="build-commit" content="([^"]*)"\s*\/?>/g)];
      if (metas.length !== 1) return [`${page}: ${metas.length} build-commit metas`];
      const [meta] = metas;
      const value = meta?.[1] ?? "";
      if (!BUILD_COMMIT_PATTERN.test(value)) return [`${page}: malformed "${value}"`];
      const headEnd = html.indexOf("</head>");
      if ((meta?.index ?? Infinity) > headEnd) return [`${page}: meta outside the head`];
      // The sha appears once: in the meta. Nothing of it is written where it renders.
      const sha = value.replace(/-dirty$/, "");
      if (html.split(sha).length !== 2) return [`${page}: the sha appears outside the meta`];
      return [];
    });
    expect(pages().length).toBeGreaterThan(0);
    expect(wrong).toEqual([]);
  });
});
