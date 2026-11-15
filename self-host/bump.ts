/**
 * Moves one product's pin: `bun self-host/bump.ts <pixelslash|toggleslash> [<sha>]`.
 *
 * With no sha it takes the product's `main`. The sha must be a full 40-character commit that
 * GitHub serves for that product's repo; one that is not on `main` is allowed, with a warning. It
 * writes self-host/pins/<product>.sha and prints the old and new sha and the compare URL for the
 * pull request. It does not commit, branch or push.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PRODUCTS = ["pixelslash", "toggleslash"] as const;
type Product = (typeof PRODUCTS)[number];

function run(cmd: string[], cwd?: string): { code: number; out: string } {
  const r = Bun.spawnSync(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
  return { code: r.exitCode ?? 1, out: (r.stdout.toString() + r.stderr.toString()).trim() };
}

function fail(line: string): never {
  console.error(line);
  process.exit(1);
}

const ghSignedIn = () => run(["gh", "auth", "status"]).code === 0;

/** Whether GitHub serves `sha` as a commit of the repo, and whether `main` contains it. */
function lookUp(product: Product, url: string, sha: string): { exists: boolean; onMain: boolean } {
  if (ghSignedIn()) {
    const repo = `repos/madangryscientist/${product}`;
    if (run(["gh", "api", `${repo}/commits/${sha}`, "--jq", ".sha"]).out !== sha) return { exists: false, onMain: false };
    // `main...sha` is "identical" or "behind" when main already has the commit.
    const status = run(["gh", "api", `${repo}/compare/main...${sha}`, "--jq", ".status"]).out;
    return { exists: true, onMain: status === "identical" || status === "behind" };
  }
  const dir = mkdtempSync(join(process.env["TMPDIR"] || tmpdir(), "slashslash-bump-"));
  try {
    run(["git", "init", "-q", "--bare"], dir);
    if (run(["git", "fetch", "-q", "--filter=blob:none", url, sha, "main:main"], dir).code !== 0)
      return { exists: false, onMain: false };
    const isCommit = run(["git", "cat-file", "-t", sha], dir).out === "commit";
    return { exists: isCommit, onMain: isCommit && run(["git", "merge-base", "--is-ancestor", sha, "main"], dir).code === 0 };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const [product, given, ...extra] = process.argv.slice(2);
if (!PRODUCTS.includes(product as Product) || extra.length > 0)
  fail("usage: bun self-host/bump.ts <pixelslash|toggleslash> [<sha>]");
const p = product as Product;
const url = `https://github.com/madangryscientist/${p}.git`;
const pinFile = join(import.meta.dir, "pins", `${p}.sha`);
const old = readFileSync(pinFile, "utf8").trim();

let sha = given?.toLowerCase();
if (sha === undefined) {
  sha = run(["git", "ls-remote", url, "refs/heads/main"]).out.split(/\s/)[0] ?? "";
  if (!/^[0-9a-f]{40}$/.test(sha)) fail(`could not read ${p} main from ${url}`);
}
if (!/^[0-9a-f]{40}$/.test(sha)) fail(`${given} is not a full 40-character commit sha`);
if (sha === old) {
  console.log(`${p} is already pinned to ${sha}`);
  process.exit(0);
}
const found = lookUp(p, url, sha);
if (!found.exists) fail(`${sha} is not a commit of ${url}; the ${p} pin is unchanged`);
if (!found.onMain) console.warn(`warning: ${sha} is not on ${p} main`);

writeFileSync(pinFile, `${sha}\n`);
console.log(`${p}: ${old} to ${sha}`);
console.log(`https://github.com/madangryscientist/${p}/compare/${old}...${sha}`);
