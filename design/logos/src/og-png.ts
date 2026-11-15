// Rasterises every share card in apps/site-next/public/og/*.svg to a 1200x630 PNG beside it.
// The text in the cards is outlined, so no font is loaded. A design tool: the PNGs are committed, and no build runs this.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const DIR = resolve(import.meta.dirname, "../../../apps/site-next/public/og");

for (const name of readdirSync(DIR).filter((file) => file.endsWith(".svg")).toSorted()) {
  const svg = readFileSync(join(DIR, name), "utf8");
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 }, font: { loadSystemFonts: false } }).render();
  if (png.width !== 1200 || png.height !== 630) throw new Error(`${name} renders at ${png.width}x${png.height}`);
  writeFileSync(join(DIR, name.replace(/\.svg$/, ".png")), png.asPng());
}
console.log("ok");
