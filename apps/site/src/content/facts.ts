/**
 * Each product's facts, read from the FACTS.md that scripts/fetch-sources.ts downloads into .sources/facts at
 * the commit facts.sha.json pins. A product claim on this site is a `Claim`: its words and the ids of the facts
 * that back it. facts.test.ts holds every claim to these files.
 *
 * A FACTS.md has a fixed shape: a `# <Name> facts` title, a `Checked against ...` line, then the sections
 * What it is (a paragraph), Today, Planned, Licence and Where it runs, each fact a line `` - `id`: text ``.
 * A file of any other shape fails the build, naming the product and the line.
 */
import flakeslashSource from "@facts/flakeslash.md?raw";
import omnislashSource from "@facts/omnislash.md?raw";
import pixelslashSource from "@facts/pixelslash.md?raw";
import taskslashSource from "@facts/taskslash.md?raw";
import toggleslashSource from "@facts/toggleslash.md?raw";
import uislashSource from "@facts/uislash.md?raw";
import type { FactsProduct } from "../../scripts/fetch-sources";

export type { FactsProduct };

/** A fact by its product and its id in that product's FACTS.md: `pixelslash/compare-two-urls`. */
export type FactId = `${FactsProduct}/${string}`;

/** The id of a product's What it is paragraph, which has no id of its own in the file. */
export const WHAT_IT_IS = "what-it-is";

/** A tool that has no repository yet, so no facts file: every claim about it must read as planned. */
export type UnbuiltTool = "BundleSlash";

/**
 * A product claim: anything that says what a product does, will do, where it runs, its licence or its
 * state, with the facts that back it. `repo` names files in this repository that back the rest, for a
 * claim about the suite's own install.
 */
export type Claim =
  | { text: string; facts: readonly [FactId, ...FactId[]]; repo?: readonly string[] }
  | { text: string; planned: UnbuiltTool };

export type Facts = {
  product: FactsProduct;
  checkedAgainst: string;
  whatItIs: string;
  today: ReadonlyMap<string, string>;
  planned: ReadonlyMap<string, string>;
  licence: string;
  whereItRuns: ReadonlyMap<string, string>;
};

const SECTIONS = ["What it is", "Today", "Planned", "Licence", "Where it runs"] as const;
type SectionName = (typeof SECTIONS)[number];

/** Reads one FACTS.md. Throws naming the product and the line when the file is not the fixed shape. */
export function parseFacts(product: FactsProduct, source: string): Facts {
  const fail = (line: number, why: string): never => {
    throw new Error(`${product} FACTS.md line ${line}: ${why}`);
  };
  const lines = source.split("\n");
  let title = false;
  let checkedAgainst = "";
  let section: SectionName | undefined;
  const what: string[] = [];
  const lists: Record<Exclude<SectionName, "What it is">, Map<string, string>> = {
    Today: new Map(),
    Planned: new Map(),
    Licence: new Map(),
    "Where it runs": new Map(),
  };
  const seen: SectionName[] = [];
  for (const [index, raw] of lines.entries()) {
    const n = index + 1;
    const line = raw.trimEnd();
    if (line === "") continue;
    if (!title) {
      if (!/^# \S.* facts$/.test(line)) fail(n, `expected the title "# <Name> facts", found "${line}"`);
      title = true;
      continue;
    }
    if (section === undefined && checkedAgainst === "") {
      const checked = line.match(/^Checked against (.+?)\.?$/);
      if (!checked?.[1]) fail(n, `expected "Checked against ...", found "${line}"`);
      checkedAgainst = checked?.[1] ?? "";
      continue;
    }
    const heading = line.match(/^## (.+)$/);
    if (heading) {
      const name = heading[1] as SectionName;
      const expected = SECTIONS[seen.length];
      if (name !== expected) fail(n, `expected the heading "## ${expected ?? "(none)"}", found "${line}"`);
      seen.push(name);
      section = name;
      continue;
    }
    if (section === undefined) fail(n, `text before the first section: "${line}"`);
    if (section === "What it is") {
      what.push(line.trim());
      continue;
    }
    const fact = line.match(/^- `([a-z0-9-]+)`: (.+)$/);
    if (!fact?.[1] || !fact[2]) fail(n, `expected a fact line "- \`id\`: text", found "${line}"`);
    const list = lists[section as Exclude<SectionName, "What it is">];
    const id = fact?.[1] ?? "";
    if (list.has(id)) fail(n, `the id ${id} appears twice in ${section ?? ""}`);
    list.set(id, fact?.[2] ?? "");
  }
  if (seen.length !== SECTIONS.length) fail(lines.length, `missing the section "## ${SECTIONS[seen.length] ?? ""}"`);
  if (what.length === 0) fail(lines.length, "the What it is section is empty");
  const licence = lists.Licence.get("licence");
  if (licence === undefined || lists.Licence.size !== 1) fail(lines.length, "Licence must hold exactly one fact, `licence`");
  return {
    product,
    checkedAgainst,
    whatItIs: what.join(" "),
    today: lists.Today,
    planned: lists.Planned,
    licence: licence ?? "",
    whereItRuns: lists["Where it runs"],
  };
}

export const FACTS: Readonly<Record<FactsProduct, Facts>> = {
  pixelslash: parseFacts("pixelslash", pixelslashSource),
  toggleslash: parseFacts("toggleslash", toggleslashSource),
  flakeslash: parseFacts("flakeslash", flakeslashSource),
  taskslash: parseFacts("taskslash", taskslashSource),
  uislash: parseFacts("uislash", uislashSource),
  omnislash: parseFacts("omnislash", omnislashSource),
};

/** Where a fact sits in its file, or undefined when its product's file has no such id. */
export function factKind(id: FactId): "what" | "today" | "planned" | "licence" | "where" | undefined {
  const [product, key = ""] = id.split("/") as [FactsProduct, string?];
  const facts = FACTS[product];
  if (facts === undefined) return undefined;
  if (key === WHAT_IT_IS) return "what";
  if (facts.today.has(key)) return "today";
  if (facts.planned.has(key)) return "planned";
  if (key === "licence") return "licence";
  if (facts.whereItRuns.has(key)) return "where";
  return undefined;
}

/** A product's licence in its facts file's words, without the full stop some files end it with. */
export const licenceOf = (product: FactsProduct): string => FACTS[product].licence.replace(/\.$/, "");

/** A product page's licence line: the facts file's own licence text, behind a label. */
export function licenceLine(product: FactsProduct): string {
  return `Licence: ${licenceOf(product)}.`;
}
