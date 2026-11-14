import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

type Colour = { r: number; g: number; b: number; a: number };

const CSS = readFileSync(resolve(import.meta.dirname, "../styles.css"), "utf8");

function tokens(theme: "dark" | "latte"): Record<string, string> {
  const blocks = CSS.matchAll(new RegExp(`^\\.${theme} \\{([\\s\\S]*?)^\\}`, "gm"));
  const block = [...blocks].map((m) => m[1]).join("");
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]]));
}

function parse(value: string): Colour {
  const hex = value.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hex) {
    const [r, g, b] = [hex[1], hex[2], hex[3]].map((part) => Number.parseInt(part ?? "", 16));
    return { r: r ?? 0, g: g ?? 0, b: b ?? 0, a: 1 };
  }
  const rgb = value.match(/^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/);
  if (!rgb) throw new Error(`Cannot read colour ${value}`);
  return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a: Number(rgb[4]) };
}

/** Lays a colour, which may be see-through, over a solid one. */
function over(top: Colour, under: Colour): Colour {
  const mix = (t: number, u: number) => t * top.a + u * (1 - top.a);
  return { r: mix(top.r, under.r), g: mix(top.g, under.g), b: mix(top.b, under.b), a: 1 };
}

function linear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance({ r, g, b }: Colour): number {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function ratio(one: Colour, two: Colour): number {
  const [a, b] = [luminance(one), luminance(two)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Text token, then the layers beneath it from the top down; the last is solid. */
const PAIRS: readonly (readonly string[])[] = [
  ...["ink", "ink-2", "ink-3"].flatMap((text) => [
    [text, "bg"],
    [text, "panel"],
    [text, "panel-2"],
  ]),
  ["accent", "bg"],
  ["accent", "accent-bg", "bg"],
  ["accent", "accent-bg", "panel"],
  ["bg", "accent"],
  ["ink", "add-bg", "panel"],
  ["ink", "del-bg", "panel"],
  ["ink", "mod-bg", "panel"],
  ["ink-2", "add-bg", "panel"],
  ["ink-2", "del-bg", "panel"],
  ["ink-2", "mod-bg", "panel"],
  ["ink-3", "add-bg", "panel"],
  ["ink-3", "del-bg", "panel"],
  ["ink-3", "mod-bg", "panel"],
  ["add", "add-bg", "panel"],
  ["del", "del-bg", "panel"],
  ["mod", "mod-bg", "panel"],
  ["add", "panel-2"],
  ["del", "bg"],
  ["mod", "bg"],
  ["mod", "hatch", "panel-2"],
  ["ink-2", "hatch", "panel-2"],
  ["ink-3", "hatch", "panel-2"],
  ["accent", "hatch", "panel-2"],
  ["mod", "hatch", "bg"],
  ["ink-2", "accent-bg", "bg"],
  // The landing page.
  ["bg", "add"],
  ["bg", "del"],
  ["accent", "panel"],
  ["add", "panel"],
  ["del", "panel"],
  ["add", "add-bg", "bg"],
  ["mod", "mod-bg", "bg"],
  ["mod", "hatch", "mod-bg", "bg"],
  ["accent", "accent-bg", "panel"],
];

describe.each(["dark", "latte"] as const)("colour contrast in %s", (theme) => {
  const t = tokens(theme);
  test.each(PAIRS.map((pair) => [pair.join(" on "), pair] as const))("%s meets AA", (_, pair) => {
    const colours = pair.map((name) => {
      const value = t[name];
      if (!value) throw new Error(`No --${name} in .${theme}`);
      return parse(value);
    });
    const text = colours[0];
    if (!text) throw new Error("A pair needs a text colour");
    const background = colours.slice(1).reduceRight((under, top) => over(top, under));
    expect(ratio(text, background)).toBeGreaterThanOrEqual(4.5);
  });
});
