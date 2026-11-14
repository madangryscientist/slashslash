/**
 * The anti-slop rules Oxlint has no rule for: a TODO/FIXME with no ticket ref, and
 * commented-out code. Run from the repo root by `bun run lint` (the `scripts:lint` task); any hit
 * fails the gate.
 */
import { globSync, readFileSync } from "node:fs";

const TODO_WITHOUT_REF = /\b(TODO|FIXME|XXX|HACK)\b(?!\s*\(#?[\w-]*\d+\))/;
// Two signals, so prose does not trip it: a statement keyword AND a trailing ; { } or ).
const CODE_IN_COMMENT =
  /^\s*\/\/\s*(?:const|let|var|import|export|return|await|if|for|while|function|throw)\b.*[;{})]\s*$/;

const hits: string[] = [];
// Every project's src and scripts, plus the root scripts, so a new project is covered with no edit.
const files = [
  ...globSync("{apps,packages}/*/{src,scripts}/**/*.{ts,tsx}"),
  ...globSync("scripts/**/*.{ts,tsx}"),
];
for (const path of files) {
  if (path === "scripts/check-slop.ts") continue;
  readFileSync(path, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (TODO_WITHOUT_REF.test(line))
        hits.push(`${path}:${i + 1}: TODO/FIXME needs a ticket ref, e.g. TODO(#123)`);
      if (CODE_IN_COMMENT.test(line))
        hits.push(`${path}:${i + 1}: commented-out code; delete it (git keeps it)`);
    });
}
if (hits.length > 0) {
  console.error(hits.join("\n"));
  process.exit(1);
}
