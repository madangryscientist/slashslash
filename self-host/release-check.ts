/**
 * Run first on a release tag push: the tag must be `self-host-v` plus the version in
 * self-host/VERSION, so `:X.Y.Z` on ghcr is always the image that says it is X.Y.Z.
 *
 *   GITHUB_REF_NAME=self-host-v0.1.0 bun self-host/release-check.ts
 */
import { readVersion } from "./build.ts";

const tag = process.env["GITHUB_REF_NAME"] ?? "";
const version = readVersion();
const tagVersion = tag.startsWith("self-host-v") ? tag.slice("self-host-v".length) : null;

if (tagVersion !== version) {
  console.error(
    `release-check: the tag '${tag}' names version ${tagVersion ?? "(none)"}, but self-host/VERSION is ${version}. ` +
      `Tag self-host-v${version}, or change self-host/VERSION first.`,
  );
  process.exit(1);
}
console.log(`release-check: tag ${tag} matches self-host/VERSION ${version}`);
