/**
 * Downloads the few PixelSlash repository files the /pixelslash pages need, at the commit pinned in
 * pixelslash.sha (PIXELSLASH_SHA overrides it, for trying another commit locally). Each file lands in
 * .sources/pixelslash/<path>; those under apps/site/public/ are also copied to public/pixelslash/, so
 * the built site serves them under /pixelslash/. Both folders are gitignored. A failed download exits
 * non-zero naming the path and the commit.
 */
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/** Every PixelSlash file the pages read, by its path in that repository. */
export const PIXELSLASH_FILES = [
  "apps/web/github-app/manifest.json",
  "apps/site/public/favicon.svg",
  "apps/site/public/fonts/inter-latin-wght-normal.woff2",
  "apps/site/public/fonts/OFL.txt",
] as const;

const REPO = "madangryscientist/pixelslash";
const SITE = resolve(import.meta.dirname, "..");
const SOURCES = resolve(SITE, ".sources/pixelslash");
const PUBLIC = resolve(SITE, "public/pixelslash");
const PUBLIC_PREFIX = "apps/site/public/";

function pinnedSha(): string {
  const sha = (process.env.PIXELSLASH_SHA ?? readFileSync(resolve(SITE, "pixelslash.sha"), "utf8")).trim();
  if (!/^[0-9a-f]{7,40}$/.test(sha)) throw new Error(`pixelslash.sha is not a commit: "${sha}"`);
  return sha;
}

async function download(sha: string, path: string): Promise<Uint8Array> {
  const url = `https://raw.githubusercontent.com/${REPO}/${sha}/${path}`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(`could not fetch ${path} at PixelSlash ${sha}: ${String(error)}`);
  }
  if (!response.ok)
    throw new Error(`could not fetch ${path} at PixelSlash ${sha}: HTTP ${response.status} from ${url}`);
  return new Uint8Array(await response.arrayBuffer());
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

try {
  await main();
} catch (error) {
  console.error(`fetch-sources: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
