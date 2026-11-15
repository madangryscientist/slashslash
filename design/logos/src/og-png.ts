// Rasterises every share card in apps/site-next/public/og/*.svg to a 1200x630 PNG beside it.
// The text in the cards is outlined, so no font is loaded. A design tool: the PNGs are committed, and no build runs this.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { crc32 } from "node:zlib";
import { Resvg } from "@resvg/resvg-js";

const DIR = resolve(import.meta.dirname, "../../../apps/site-next/public/og");

/** A PNG tEXt chunk. Each PNG carries its SVG's hash in one, so a test can tell a PNG left behind by its SVG. */
function textChunk(key: string, value: string): Buffer {
  const data = Buffer.from(`${key}\0${value}`, "latin1");
  const type = Buffer.from("tEXt", "latin1");
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  type.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([type, data])), 8 + data.length);
  return out;
}

for (const name of readdirSync(DIR).filter((file) => file.endsWith(".svg")).toSorted()) {
  const svg = readFileSync(join(DIR, name), "utf8");
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 }, font: { loadSystemFonts: false } }).render();
  if (png.width !== 1200 || png.height !== 630) throw new Error(`${name} renders at ${png.width}x${png.height}`);
  const bytes = png.asPng();
  // The signature (8 bytes) and IHDR (25) come first; the hash goes straight after them.
  const hash = createHash("sha256").update(svg).digest("hex");
  writeFileSync(join(DIR, name.replace(/\.svg$/, ".png")), Buffer.concat([bytes.subarray(0, 33), textChunk("svg-sha256", hash), bytes.subarray(33)]));
}
console.log("ok");
