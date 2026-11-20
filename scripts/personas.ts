// Checks docs/personas/personas.json and keeps the table in docs/personas/README.md in step with it.
//
//   bun scripts/personas.ts          rewrite the generated part of the README
//   bun scripts/personas.ts --check  fail if the file is invalid or the generated part is stale
//
// The JSON is the source of truth: edit it, then run this once. No dependencies. This repo keeps
// exactly five personas, so a persona vote always has a winner. device, pages and questions are
// this repo's own keys; a shared reader may ignore them.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "docs/personas");
const jsonPath = join(dir, "personas.json");
const readmePath = join(dir, "README.md");
const START = "<!-- personas:start -->";
const END = "<!-- personas:end -->";
const REQUIRED = 5;
const DASH = /[\u2013\u2014]/;

type Persona = {
	id: string;
	name: string;
	group: string;
	model: string;
	device: string;
	pages: string[];
	profile: string;
	focus: Record<string, string>;
	questions: string[];
};
type File = { groups: Record<string, string>; models: string[]; personas: Persona[] };

type Fields = Record<string, unknown>;

const text = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const fields = (v: unknown): v is Fields => typeof v === "object" && v !== null && !Array.isArray(v);
const nonEmptyList = (v: unknown, each: (x: unknown) => boolean): boolean =>
	Array.isArray(v) && v.length > 0 && v.every(each);
const pagePath = (x: unknown): boolean => text(x) && x.startsWith("/");
const yesNoQuestion = (x: unknown): boolean => text(x) && x.endsWith("?");
const kebab = (x: unknown): boolean => text(x) && /^[a-z][a-z0-9-]*$/.test(x);

function focusError(focus: unknown): string | undefined {
	if (!fields(focus) || Object.keys(focus).length === 0) return "needs a focus line";
	if (!Object.values(focus).every(text)) return "every focus line needs text";
	return undefined;
}

/** What is wrong with one persona, each problem once, in the order of its keys. */
function personaErrors(p: Fields, groups: Fields, models: unknown[], duplicate: boolean): string[] {
	const focus = focusError(p.focus);
	const checks: [ok: boolean, why: string][] = [
		[kebab(p.id), "id must be lower-case kebab"],
		[!duplicate, "duplicate id"],
		[text(p.name), "name is empty"],
		[text(p.group) && Object.hasOwn(groups, p.group), `group "${String(p.group)}" is not in groups`],
		[models.includes(p.model), `model "${String(p.model)}" is not in models`],
		[text(p.device), "device is empty"],
		[nonEmptyList(p.pages, pagePath), "pages must be a non-empty list of paths starting with /"],
		[text(p.profile), "profile is empty"],
		[focus === undefined, focus ?? ""],
		[nonEmptyList(p.questions, yesNoQuestion), "questions must be a non-empty list of yes or no questions ending in ?"],
	];
	const at = `persona ${text(p.id) ? p.id : "?"}`;
	return checks.filter(([ok]) => !ok).map(([, why]) => `${at}: ${why}`);
}

function everyPersonaErrors(personas: unknown[], groups: Fields, models: unknown[]): string[] {
	const errs: string[] = [];
	const ids = new Set<unknown>();
	for (const p of personas) {
		if (!fields(p)) {
			errs.push("persona ?: must be an object");
			continue;
		}
		errs.push(...personaErrors(p, groups, models, ids.has(p.id)));
		ids.add(p.id);
	}
	return errs;
}

function validate(f: unknown): string[] {
	if (!fields(f)) return ["the file must be an object"];
	const { groups, models, personas } = f;
	if (!fields(groups) || !Object.values(groups).every(text)) return ["groups must be an object of names"];
	if (!Array.isArray(models) || !models.every(text)) return ["models must be a list of names"];
	if (!Array.isArray(personas)) return ["personas must be a list"];
	const errs: string[] = [];
	if (personas.length !== REQUIRED) errs.push(`need exactly ${REQUIRED} personas, found ${personas.length}`);
	errs.push(...everyPersonaErrors(personas, groups, models));
	if (DASH.test(JSON.stringify(f))) errs.push("an em or en dash is not allowed");
	return errs;
}

/** True when the parsed JSON has the shape validate checks, so the README can be generated from it. */
const isFile = (f: unknown): f is File => validate(f).length === 0;

const cell = (s: string) => s.replace(/\s*[\r\n]+\s*/g, " ").replace(/\|/g, "\\|");

function generated(f: File): string {
	const subjects = [...new Set(f.personas.flatMap((p) => Object.keys(p.focus)))].toSorted();
	const head = ["Persona", "Group", "Model", "Device", "Pages", "Who", ...subjects.map((s) => `Looks for (${s})`)];
	const rows = f.personas.map((p) =>
		[
			p.name,
			f.groups[p.group] ?? "",
			p.model,
			p.device,
			p.pages.map((x) => `\`${x}\``).join(", "),
			p.profile,
			...subjects.map((s) => p.focus[s] ?? "(none yet)"),
		].map(cell),
	);
	const table = [
		`| ${head.join(" | ")} |`,
		`| ${head.map(() => "---").join(" | ")} |`,
		...rows.map((r) => `| ${r.join(" | ")} |`),
	].join("\n");
	const questions = f.personas.map((p) => [`**${p.name}**`, ...p.questions.map((q) => `- ${q}`)].join("\n"));
	return [table, "", "### Review questions", "", questions.join("\n\n")].join("\n");
}

const file: unknown = JSON.parse(readFileSync(jsonPath, "utf8"));
if (!isFile(file)) {
	console.error(validate(file).map((e) => `personas.json: ${e}`).join("\n"));
	process.exit(1);
}
const readme = readFileSync(readmePath, "utf8");
if (DASH.test(readme)) {
	console.error("README.md: an em or en dash is not allowed");
	process.exit(1);
}
const a = readme.indexOf(START);
const b = readme.indexOf(END);
if (a < 0 || b < a) {
	console.error(`README.md needs ${START} and ${END} markers`);
	process.exit(1);
}
const next = `${readme.slice(0, a + START.length)}\n${generated(file)}\n${readme.slice(b)}`;
if (process.argv.includes("--check")) {
	if (next !== readme) {
		console.error("docs/personas/README.md is stale: run bun scripts/personas.ts");
		process.exit(1);
	}
	console.log(`ok: ${file.personas.length} personas`);
} else {
	writeFileSync(readmePath, next);
	console.log(`wrote the table for ${file.personas.length} personas`);
}
