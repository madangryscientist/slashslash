/**
 * Builds the one self-host image, as CI does: each product's own self-host image from its repo at
 * the commit in pins/<product>.sha (a BuildKit git context, so no checkout), then self-host/Dockerfile
 * with those images and repos handed in as named build contexts.
 *
 *   bun self-host/build.ts [--tag slashslash:dev]
 *
 * A product image already built for its pin is reused, so only a moved pin rebuilds a product. The
 * products build one after the other, since each is a few minutes of CPU on its own.
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

export const PRODUCTS = [
  { name: "pixelslash", dockerfile: "docker/self-host/Dockerfile" },
  { name: "toggleslash", dockerfile: "apps/server/Dockerfile" },
] as const;

export function pin(product: string): string {
  const sha = readFileSync(join(ROOT, "self-host/pins", `${product}.sha`), "utf8").trim();
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error(`self-host/pins/${product}.sha is not a full commit SHA`);
  return sha;
}

export const repo = (product: string) => `https://github.com/madangryscientist/${product}.git`;
export const productImage = (product: string) => `slashslash-product/${product}:${pin(product)}`;

function run(args: string[], quiet = false): number {
  if (!quiet) console.log(`$ docker ${args.join(" ")}`);
  const result = Bun.spawnSync(["docker", ...args], {
    cwd: ROOT,
    stdout: quiet ? "ignore" : "inherit",
    stderr: quiet ? "ignore" : "inherit",
  });
  return result.exitCode;
}

export function build(tag: string): void {
  const contexts: string[] = [];
  const buildArgs: string[] = [];
  for (const { name, dockerfile } of PRODUCTS) {
    const sha = pin(name);
    const image = productImage(name);
    if (run(["image", "inspect", image], true) !== 0) {
      if (run(["build", "-f", dockerfile, "-t", image, `${repo(name)}#${sha}`]) !== 0)
        throw new Error(`building ${name} at ${sha} failed`);
    } else {
      console.log(`${image} is already built`);
    }
    contexts.push("--build-context", `${name}=docker-image://${image}`);
    contexts.push("--build-context", `${name}-src=${repo(name)}#${sha}`);
    buildArgs.push("--build-arg", `${name.toUpperCase()}_REVISION=${sha}`);
  }
  if (run(["build", "-f", "self-host/Dockerfile", ...contexts, ...buildArgs, "-t", tag, "."]) !== 0)
    throw new Error("building the self-host image failed");
}

if (import.meta.main) {
  const at = process.argv.indexOf("--tag");
  build(at > 0 ? process.argv[at + 1]! : "slashslash:dev");
}
