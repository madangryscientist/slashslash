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

const text = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

function validate(f: File): string[] {
	const errs: string[] = [];
	if (!f.groups || typeof f.groups !== "object") return ["groups must be an object"];
	if (!Array.isArray(f.models)) return ["models must be a list"];
	if (!Array.isArray(f.personas)) return ["personas must be a list"];
	if (f.personas.length !== REQUIRED)
		errs.push(`need exactly ${REQUIRED} personas, found ${f.personas.length}`);
	const ids = new Set<string>();
	for (const p of f.personas) {
		const at = `persona ${text(p.id) ? p.id : "?"}`;
		if (!text(p.id) || !/^[a-z][a-z0-9-]*$/.test(p.id)) errs.push(`${at}: id must be lower-case kebab`);
		if (ids.has(p.id)) errs.push(`${at}: duplicate id`);
		ids.add(p.id);
		if (!text(p.name)) errs.push(`${at}: name is empty`);
		if (!text(p.group) || !Object.hasOwn(f.groups, p.group)) errs.push(`${at}: group "${p.group}" is not in groups`);
		if (!f.models.includes(p.model)) errs.push(`${at}: model "${p.model}" is not in models`);
		if (!text(p.device)) errs.push(`${at}: device is empty`);
		if (!Array.isArray(p.pages) || p.pages.length === 0 || !p.pages.every((x) => text(x) && x.startsWith("/")))
			errs.push(`${at}: pages must be a non-empty list of paths starting with /`);
		if (!text(p.profile)) errs.push(`${at}: profile is empty`);
		if (!p.focus || typeof p.focus !== "object" || Array.isArray(p.focus) || Object.keys(p.focus).length === 0)
			errs.push(`${at}: needs a focus line`);
		else if (!Object.values(p.focus).every(text)) errs.push(`${at}: every focus line needs text`);
		if (!Array.isArray(p.questions) || p.questions.length === 0 || !p.questions.every((q) => text(q) && q.endsWith("?")))
			errs.push(`${at}: questions must be a non-empty list of yes or no questions ending in ?`);
	}
	if (DASH.test(JSON.stringify(f))) errs.push("an em or en dash is not allowed");
	return errs;
}

const cell = (s: string) => s.replace(/\s*[\r\n]+\s*/g, " ").replace(/\|/g, "\\|");

function generated(f: File): string {
	const subjects = [...new Set(f.personas.flatMap((p) => Object.keys(p.focus)))].sort();
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

const file = JSON.parse(readFileSync(jsonPath, "utf8")) as File;
const errs = validate(file);
if (errs.length) {
	console.error(errs.map((e) => `personas.json: ${e}`).join("\n"));
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
