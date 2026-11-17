import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";
import { PIXELSLASH_FILES } from "../scripts/fetch-sources";

const SITE = resolve(import.meta.dirname, "..");
const SCRIPT = resolve(SITE, "scripts/fetch-sources.ts");
const TOUCHED = [resolve(SITE, ".sources"), resolve(SITE, "public/pixelslash")];

/** Every file under a folder with its modification time, so a delete or a rewrite shows. */
function snapshot(dir: string): Record<string, number> {
  if (!existsSync(dir)) return {};
  const out: Record<string, number> = {};
  for (const name of readdirSync(dir, { recursive: true, encoding: "utf8" })) {
    const path = resolve(dir, name);
    out[name] = statSync(path).mtimeMs;
  }
  return out;
}

test("--list prints exactly PIXELSLASH_FILES and touches no fetched folder", () => {
  const before = TOUCHED.map(snapshot);
  const run = spawnSync("bun", [SCRIPT, "--list"], { encoding: "utf8" });
  expect(run.status, run.stderr).toBe(0);
  expect(run.stdout).toBe(`${PIXELSLASH_FILES.join("\n")}\n`);
  expect(TOUCHED.map(snapshot)).toEqual(before);
});
