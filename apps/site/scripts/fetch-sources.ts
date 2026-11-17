/**
 * Downloads the few PixelSlash repository files the /pixelslash pages need, at the commit pinned in
 * pixelslash.sha (PIXELSLASH_SHA overrides it, for trying another commit locally). Each file lands in
 * .sources/pixelslash/<path>; those under apps/site/public/ are also copied to public/pixelslash/, so
 * the built site serves them under /pixelslash/. Both folders are gitignored. A failed download exits
 * non-zero naming the path and the commit.
 *
 * `--list` prints PIXELSLASH_FILES, one per line, and exits without fetching or deleting anything. The
 * pin bot (.github/workflows/pixelslash-pin.yml) reads it to decide whether a PixelSlash change matters.
 */
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/** Every PixelSlash file the pages read, by its path in that repository. */
export const PIXELSLASH_FILES = [
  "apps/web/github-app/manifest.json",
  "apps/site/public/hero/main.png",
  "apps/site/public/hero/branch.png",
  "apps/site/public/report.png",
  // Imported, not served: hero.json describes the two hero images, so it comes from the same commit.
  "apps/site/src/content/hero.json",
  "docs/capabilities/data.json",
] as const;

const REPO = "madangryscientist/pixelslash";
const SITE = resolve(import.meta.dirname, "..");
const SOURCES = resolve(SITE, ".sources/pixelslash");
const PUBLIC = resolve(SITE, "public/pixelslash");
const PUBLIC_PREFIX = "apps/site/public/";

function pinnedSha(): string {
  // An empty PIXELSLASH_SHA counts as unset.
  const fromEnv = process.env.PIXELSLASH_SHA?.trim();
  const source = fromEnv ? "PIXELSLASH_SHA" : "pixelslash.sha";
  const sha = fromEnv || readFileSync(resolve(SITE, "pixelslash.sha"), "utf8").trim();
  // A full commit SHA: a short one is not a stable pin.
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error(`${source} is not a full commit SHA: "${sha}"`);
  return sha;
}

async function download(sha: string, path: string): Promise<Uint8Array> {
  const url = `https://raw.githubusercontent.com/${REPO}/${sha}/${path}`;
  let response: Response;
  let body: ArrayBuffer;
  try {
    response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
    body = await response.arrayBuffer();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`could not fetch ${path} at PixelSlash ${sha}: ${reason}`);
  }
  return new Uint8Array(body);
}

async function main(): Promise<void> {
  const sha = pinnedSha();
  const bodies = await Promise.all(PIXELSLASH_FILES.map((path) => download(sha, path)));
  // Written only once every file has arrived, so a failure leaves no half-updated folder behind.
  rmSync(SOURCES, { recursive: true, force: true });
  rmSync(PUBLIC, { recursive: true, force: true });
  PIXELSLASH_FILES.forEach((path, i) => {
    const target = resolve(SOURCES, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bodies[i] ?? new Uint8Array());
    if (path.startsWith(PUBLIC_PREFIX)) {
      const served = resolve(PUBLIC, path.slice(PUBLIC_PREFIX.length));
      mkdirSync(dirname(served), { recursive: true });
      copyFileSync(target, served);
    }
  });
  console.log(`fetched ${PIXELSLASH_FILES.length} PixelSlash files at ${sha}`);
}

// Run only as a script, so a test can import PIXELSLASH_FILES without a fetch.
if (import.meta.main) {
  if (process.argv.includes("--list")) {
    console.log(PIXELSLASH_FILES.join("\n"));
  } else {
    try {
      await main();
    } catch (error) {
      console.error(`fetch-sources: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
}
